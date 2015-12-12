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

function Game() {
  var that = this
  this.canvas = new Canvas()
  this.controls = new Controls()
  this.currentLevel = -1
  this.sprites = []
  this.physics = new p2.World({gravity: [0, 100]})
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
    var x = sprite.physicsBody.width * sprite.blockSize
    ctx.fillStyle = '#000000'
    ctx.fillRect(sprite.x, sprite.y, sprite.width, sprite.height)
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
        that.addSprite( new window[type](currentSprite[0], currentSprite[1]) )
      }
    }
  }
  this.start = function() {
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
    that.physics.step(1/60)
    for (var sprite in that.sprites) {
      var currentSprite = that.sprites[sprite]
      currentSprite.x = currentSprite.physicsBody.position[0]
      currentSprite.y = currentSprite.physicsBody.position[1]
    }
  }
  this.applyControls = function() {
    if (this.controls.zDown) this.car.accelerate()
    if (this.controls.xDown) this.car.tryToJump()
  }
}

function Sprite() {
  this.blockSize = 64
  this.setupDescendant = function(blockX, blockY, blockWidth, blockHeight, mass) {
    this.x = blockX * this.blockSize
    this.y = blockY * this.blockSize
    this.width = blockWidth * this.blockSize
    this.height = blockHeight * this.blockSize
    this.physicsBody = new p2.Body({
      mass: mass,
      position: [this.x, this.y],
      fixedRotation: true
    })
    this.physicsShape = new p2.Box({width: this.width, height: this.height})
    this.physicsBody.addShape(this.physicsShape)
  }
}

Scenery.prototype = new Sprite()
function Scenery(blockX, blockY, blockWidth, blockHeight) {
  this.mass = 0
  this.setupDescendant(blockX, blockY, blockWidth, blockHeight, this.mass)
}

Bush.prototype = new Scenery()
function Bush(blockX, blockY) {
  this.width = 1
  this.height = 1
  this.setupDescendant(blockX, blockY, this.width, this.height, this.mass)
}

GroundBlock.prototype = new Scenery()
function GroundBlock(blockX, blockY) {
  this.width = 10
  this.height = 1
  this.setupDescendant(blockX, blockY, this.width, this.height, this.mass)
}

Car.prototype = new Sprite()
function Car(blockX, blockY) {
  this.width = 1
  this.height = 1
  this.mass = 5
  this.setupDescendant(blockX, blockY, this.width, this.height, this.mass)
  this.accelerate = function() {
    this.physicsBody.applyForce([500, 0])
  }
  this.tryToJump = function() {
    // this.physicsBody.applyForce([0, -5000])
    for (var sprite in game.sprites) {
      var currentSprite = game.sprites[sprite]
      var car = this.physicsBody
      var other = currentSprite.physicsBody
      if (car.overlaps(other) && // there is a collision and
        car.position[1] < other.position[1]) { // car is above
          var distanceToRight = Math.abs(car.position[0] - other.position[0])
          var distanceToLeft = Math.abs(car.position[0] - (other.position[0] + other.shapes[0].width) )
          if (distanceToRight < distanceToLeft) { // on right
            console.log('on right')
          }
          else { // on left

          }
      }
    }
  }
}


var game = new Game()
game.start()
