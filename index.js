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
    var r = 82
    if (event.type == 'keydown') {
      if (event.keyCode == z) that.zDown = true
      else if (event.keyCode == x) that.xDown = true
      else if (event.keyCode == r) game.car.die()
    }
    else if (event.type == 'keyup') {
      if (event.keyCode == z) that.zDown = false
      else if (event.keyCode == x) that.xDown = false
    }
  }
}

function Game() {
  var that = this
  this.state = 'playing'
  this.canvas = new Canvas()
  this.controls = new Controls()
  this.currentLevel = -1
  this.physics = new p2.World()
  this.blockSize = 64
  this.cameraPosition = []
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
    switch (that.state) {
      case 'playing': that.renderPlaying()
      break
      case 'dead': that.renderDead()
      break
      case 'finished': that.renderFinished()
      break
    }
  }
  this.renderPlaying = function() {
    that.applyControls()
    that.applyPhysics()
    that.car.checkIfDead()
    that.car.checkInteractions()
    that.elevator.update()
    that.canvas.clear()
    for (var sprite in that.sprites) {
      var currentSprite = that.sprites[sprite]
      that.drawSprite(currentSprite)
    }
  }
  this.renderDead = function() {
    this.deathOpacity += .01
    if (this.deathOpacity < 1) {
      var ctx = this.canvas.ctx
      ctx.globalAlpha = this.deathOpacity
      this.canvas.clear()
      ctx.globalAlpha = 1
    }
    else {
      this.loadLevel()
      this.state = 'playing'
    }
  }
  this.renderFinished = function() {
    var ctx = this.canvas.ctx
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, this.width, this.height)
    ctx.fillStyle = 'black'
    ctx.font = '20px monospace'
    var finishedText = 'THE END... for now. Thanks for playing! ;[]'
    var textMeasure = ctx.measureText(finishedText)
    ctx.fillText(finishedText, this.width / 2 - textMeasure.width / 2, this.height / 2)
  }
  this.drawSprite = function(sprite) {
    var ctx = this.canvas.ctx
    var x = sprite.physicsBody.position[0] - sprite.physicsShape.width / 2
    var y = sprite.physicsBody.position[1] - sprite.physicsShape.height / 2
    x -= this.cameraPosition[0]
    y -= this.cameraPosition[1]
    var width = sprite.physicsShape.width
    var height = sprite.physicsShape.height
    ctx.fillStyle = sprite.color
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
  this.loadLevel = function() {
    that.physics.clear()
    that.physics.gravity = [0, 1000]
    that.sprites = []
    var level = that.levels[that.currentLevel]
    for (var type in level) {
      var currentType = level[type]
      for (var sprite in currentType) {
        var currentSprite = currentType[sprite]
        that.addSprite( new window[type](currentSprite) )
      }
    }
  }
  this.loadNextLevel = function() {
    that.currentLevel++
    if (that.currentLevel == that.levels.length) game.state = 'finished'
    that.loadLevel(that.currentLevel)
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
    else if (sprite instanceof Elevator) that.elevator = sprite
  }
  this.applyPhysics = function() {
    that.physics.step(1/60)
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
  this.color = 'black'
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
  this.accelerateForce = [500, 0]
  this.jumpDelay = 100
  this.hasFootingPadding = 1
  this.setupDescendant(blockDimensions, this.mass)
  this.lastXVelocity = 0
  this.minCrashSpeed = 200
  this.deadHeight = 600
  this.accelerate = function() {
    if (this.hasFooting) {
      this.physicsBody.applyForce(this.accelerateForce)
    }
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
  this.checkIfDead = function() {
    var currentXVelocity = this.physicsBody.velocity[0]
    if ( this.lastXVelocity > this.minCrashSpeed && Math.abs(currentXVelocity) < Math.abs(this.lastXVelocity / 2) ) {
      if (!game.car.hasBomb) {
        game.deathOpacity = 0
        this.die()
      }
      else {
        for (var sprite in game.sprites) {
          var currentSprite = game.sprites[sprite]
          if (this.physicsBody.overlaps(currentSprite.physicsBody) &&
              Math.abs( this.physicsBody.position[1] - currentSprite.physicsBody.position[1] ) < currentSprite.physicsShape.height * .9 ) {
            game.physics.removeBody(currentSprite.physicsBody)
            game.sprites.splice(sprite, 1)
            game.car.physicsBody.velocity[0] = this.lastXVelocity
            game.car.physicsBody.applyImpulse([300, -300])
            this.color = 'black'
            this.hasBomb = false
          }
        }
      }
    }
    if ( Math.abs(this.physicsBody.position[1]) > this.deadHeight ) {
      if (this.physicsBody.overlaps(game.elevator.physicsBody)) game.loadNextLevel()
      else this.die()
    }
    this.lastXVelocity = currentXVelocity
  }
  this.checkInteractions = function() {
    for (var sprite in game.sprites) {
      var currentSprite = game.sprites[sprite]

      if (this.physicsBody.overlaps(currentSprite.physicsBody)) {
        if (currentSprite instanceof Bomb) {
            game.sprites.splice(sprite, 1)
            game.car.color = 'orange'
            game.car.hasBomb = true
        }
      }
    }
  }
  this.die = function() {
    game.deathOpacity = 0
    game.state = 'dead'
  }
}

Bomb.prototype = new Sprite()
function Bomb(blockDimensions) {
  blockDimensions[2] = 1
  blockDimensions[3] = 1
  this.mass = 0
  this.color = 'red'
  this.setupDescendant(blockDimensions, this.mass)
  this.physicsShape.sensor = true
}

Elevator.prototype = new Mover()
function Elevator(blockDimensions) {
  this.color = 'green'
  this.setupDescendant(blockDimensions, this.mass)
  this.physicsBody.gravityScale = 0
  this.update = function() {
    if (this.physicsBody.overlaps(game.car.physicsBody)) {
      this.physicsBody.gravityScale = -2
    }
  }
}


var game = new Game()
game.start()
