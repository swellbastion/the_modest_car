function Canvas() {
  this.element = document.querySelector('canvas')
  this.ctx = this.element.getContext('2d')
  this.resize = function() {
    this.element.width = innerWidth
    this.element.height = innerHeight
  }
  this.clear = function() {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillRect(0, 0, this.element.width, this.element.height)
  }
}

function Controls() {
  var that = this
  this.zDown = false
  this.xDown = false
  this.init = function() {
    onkeydown = this.onControlsEvent
    onkeyup = this.onControlsEvent
  }
  this.onControlsEvent = function(event) {
    var z = 90
    var x = 88
    if (event.type == 'keydown') {
      if (event.keyCode == z) that.zDown = true
      else if (event.keyCode == x) that.xDown = true
    }
    else if (event.type == 'keyup') {
      if (event.keyCode == z) that.zDown = false
      else if (event.keyCode == x) that.xDown = false
    }
  }
}

function DeltaUpdater() {
  this.init = function() {
    this.lastDelta = Date.now() / 1000
  }
  this.update = function() {
    var now = Date.now() / 1000
    game.delta = now - this.lastDelta
    this.lastDelta = now
  }
}

function Game() {
  var that = this
  this.canvas = new Canvas()
  this.controls = new Controls()
  this.currentLevel = -1
  this.sprites = []
  this.physics = new p2.World({gravity: [0, 1000]})
  this.blockSize = 64
  this.cameraPosition = []
  this.deltaUpdater = new DeltaUpdater()
  this.needsResize = function() {
    if (this.width != innerWidth || this.height != innerHeight)
      return true
    else
      return false
  }
  this.resize = function() {
    this.width = innerWidth
    this.height = innerHeight
    this.canvas.resize()
  }
  this.render = function() {
    requestAnimationFrame(that.render)
    if (that.needsResize()) that.resize()
    that.deltaUpdater.update()
    that.applyControls()
    that.applyPhysics()
    that.canvas.clear()
    for (var sprite in that.sprites) {
      var currentSprite = that.sprites[sprite]
      that.drawSprite(currentSprite)
    }
  }
  this.drawSprite = function(sprite) {
    var ctx = this.canvas.ctx
    var x = sprite.physicsBody.position[0] - sprite.physicsShape.width / 2
    var y = sprite.physicsBody.position[1] - sprite.physicsShape.height / 2
    x -= this.cameraPosition[0]
    y -= this.cameraPosition[1]
    var width = sprite.physicsShape.width
    var height = sprite.physicsShape.height
    ctx.fillStyle = '#000000'
    ctx.fillRect(x, y, width, height)
  }
  this.loadData = function(callback) {
    var xhr = new XMLHttpRequest()
    xhr.open('get', 'levels.json')
    xhr.onload = function() {
      that.levels = JSON.parse(xhr.response)
      callback()
    }
    xhr.send()
  }
  this.loadNextLevel = function() {
    that.currentLevel++
    var level = that.levels[that.currentLevel]
    for (var type in level) {
      var currentType = level[type]
      for (var sprite in currentType) {
        var currentSprite = currentType[sprite]
        that.addSprite( new window[type](currentSprite) )
      }
    }
  }
  this.start = function() {
    this.deltaUpdater.init()
    this.controls.init()
    this.loadData(function() {
      that.loadNextLevel()
      that.render()
    })
  }
  this.addSprite = function(sprite) {
    that.physics.addBody(sprite.physicsBody)
    that.sprites.push(sprite)
    if (sprite instanceof Car) that.car = sprite
  }
  this.applyPhysics = function() {
    that.physics.step(that.delta)
  }
  this.applyControls = function() {
    this.car.checkIfHasFooting()
    if (this.controls.zDown) this.car.accelerate()
    if (this.controls.xDown) this.car.tryToJump()
    this.cameraPosition[0] = this.car.physicsBody.position[0] - this.width / 2
    this.cameraPosition[1] = this.car.physicsBody.position[1] - this.height / 2
  }
}

function Sprite() {
  this.setupDescendant = function(blockDimensions, mass) {
    this.physicsBody = new p2.Body({
      mass: mass,
      position: [blockDimensions[0] * game.blockSize, blockDimensions[1] * game.blockSize],
      fixedRotation: true
    })
    this.physicsShape = new p2.Box({width: blockDimensions[2] * game.blockSize, height: blockDimensions[3] * game.blockSize})
    this.physicsBody.addShape(this.physicsShape)
  }
}

Scenery.prototype = new Sprite()
function Scenery() {
  this.mass = 0
}

Mover.prototype = new Sprite()
function Mover() {
  this.mass = 1
}

Bush.prototype = new Scenery()
function Bush(blockDimensions) {
  blockDimensions[2] = 1
  blockDimensions[3] = 1
  this.setupDescendant(blockDimensions, this.mass)
}

Ground.prototype = new Scenery()
function Ground(blockDimensions) {
  this.setupDescendant(blockDimensions, this.mass)
}

Car.prototype = new Mover()
function Car(blockDimensions) {
  blockDimensions[2] = 1
  blockDimensions[3] = 1
  this.jumpForce = [0, -500]
  this.accelerateForce = 30000
  this.jumpDelay = 100
  this.hasFootingPadding = 1
  this.setupDescendant(blockDimensions, this.mass)
  this.accelerate = function() {
    console.log(this.accelerateForce * game.delta)
    if (this.hasFooting)
      this.physicsBody.applyForce(
        [this.accelerateForce * game.delta, 0])
  }
  this.mayJump = function() {
    var now = Date.now()
    if (now < this.lastJumpTime + this.jumpDelay) return false
    else if (this.hasFooting) {
      this.lastJumpTime = now
      return true
    }
  }
  this.checkIfHasFooting = function() {
    for (var sprite in game.sprites) {
      var other = game.sprites[sprite]
      var carPosition = [
        this.physicsBody.position[0] - this.physicsShape.width / 2,
        this.physicsBody.position[1] - this.physicsShape.height / 2
      ]
      var otherPosition = [
        other.physicsBody.position[0] - other.physicsShape.width / 2,
        other.physicsBody.position[1] - other.physicsShape.height / 2
      ]
      if (this.physicsBody.overlaps(other.physicsBody) &&
        carPosition[1] < otherPosition[1] - this.physicsShape.height + this.hasFootingPadding) {
          this.hasFooting = true
          return
        }
    }
    this.hasFooting = false
  }
  this.tryToJump = function() {
    if (this.mayJump()) {
      this.physicsBody.applyImpulse(this.jumpForce)
    }
  }
}


var game = new Game()
game.start()
