function Canvas() {
  this.element = document.querySelector('canvas')
  this.ctx = this.element.getContext('2d')
  this.resize = function() {
    this.element.width = innerWidth
    this.element.height = innerHeight
  }
}

function Game() {
  var that = this
  this.canvas = new Canvas()
  this.currentLevel = -1
  this.sprites = []
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
    for (var sprite in that.sprites) {
      var currentSprite = that.sprites[sprite]
      that.drawSprite(currentSprite)
    }
  }
  this.drawSprite = function(sprite) {
    var ctx = this.canvas.ctx
    ctx.fillRect(sprite.x, sprite.y, sprite.blockSize, sprite.blockSize)
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
        that.sprites.push( new window[type](currentSprite[0], currentSprite[1]) )
      }
    }
  }
  this.start = function() {
    this.loadData(function() {
      that.loadNextLevel()
      that.render()
    })
  }
}

function Sprite() {
  this.blockSize = 64
  this.setSize = function(blockX, blockY) {
    this.x = blockX * this.blockSize
    this.y = blockY * this.blockSize
  }
}

Bush.prototype = new Sprite()
function Bush(blockX, blockY) {
  this.setSize(blockX, blockY)
}


var game = new Game()
game.start()
