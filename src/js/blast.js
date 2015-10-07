/*
 * =============================================================================
 * Tunnel Blast - a browser-based 'Breakout'-style game
 * =============================================================================
 * written for the March phase of One Game A Month
 * -----------------------------------------------------------------------------
 * (c) 2013 chrisatthestudy
 * -----------------------------------------------------------------------------
 */

/* Position of "new bullet" label */
var nb_x = 24;
var nb_y = 72;

/* Position of "new bullet" count-down digits */
var nbd_x = 192;
var nbd_y = 72;

/* Position of "score" digits */
var s_x = 380;
var s_y = 98;

/* Wall-descent speeds */
var W_SPEED_NORMAL = 0.2;
var W_SPEED_FAST = 0.5;

/* Bullet speed */
var B_SPEED_NORMAL = 5;

/* Score multiplier */
var S_BONUS = 1;

/*
 * -----------------------------------------------------------------------------
 * Params class, to hold constants and configuration options.
 * -----------------------------------------------------------------------------
 */
 
Params = function() {
    // Block Types
    this.B_NONE = -1;  // No block
    this.B_STND =  0;  // standard block                                      
    this.B_GROW =  1;  // increase paddle size block
    this.B_MULT =  2;  // multiple bullets block
    this.B_BOMB =  3;  // bomb block (destroys all on-screen blocks) [1]
    this.B_FIXT =  4;  // fixed block (cannot be destroyed except by a bomb)
    this.B_SPED =  5;  // speeder - increases the rate of descent
    this.B_SLOW =  6;  // brake - slows all bullets
    this.B_SUPR =  7;  // super-bullet - does not bounce off blocks
    this.block_images = [
        "graphics/block_00.png",
        "graphics/block_01.png",
        "graphics/block_02.png",
        "graphics/block_03.png",
        "graphics/block_04.png",
        "graphics/block_05.png",
        "graphics/block_06.png",
        "graphics/block_07.png"
    ];
    // Game states
    this.G_READY = 0;   // Ready to start the game.
    this.G_ACTIVE = 1;  // Game in progress.
    this.G_OVER = 2;    // Game over.
}

/*
 * -----------------------------------------------------------------------------
 * Digit class, holding a sprite which can display a selected digit, from 0 to
 * 9. Inherits from jaws.Sprite.
 * -----------------------------------------------------------------------------
 */
Digit = function(options, game) {
    // Call the inherited constructor.
    this.constructor(options);
    // Keep a reference to the main game context object.
    this.game = game;
    // Load the digits as a sprite-sheet
    imagefile = "graphics/digits_red_01.png";
    sprite_sheet = new jaws.SpriteSheet({image: imagefile, frame_size: [24, 24]});
    this.frames = sprite_sheet.frames;
    this.digit = 0;
}
// Constructor, to enable inheritance.
Digit.prototype = (function(){
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.Sprite.prototype;
    return new inherited;
})();
Digit.prototype.update = function() {
    this.setImage(this.frames[this.digit]);
}

/*
 * -----------------------------------------------------------------------------
 * Digits class, displaying a multi-digit number. Inherits from jaws.Sprite.
 * -----------------------------------------------------------------------------
 */
Digits = function(options, game) {
    // Call the inherited constructor.
    this.constructor(options);
    // Keep a reference to the main game context object.
    this.game = game;
    // Load the digits as a sprite-sheet
    imagefile = "graphics/digits_blue_01.png";
    sprite_sheet = new jaws.SpriteSheet({image: imagefile, frame_size: [24, 24]});
    this.frames = sprite_sheet.frames;
    this.value = 0;
}
// Constructor, to enable inheritance.
Digits.prototype = (function(){
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.Sprite.prototype;
    return new inherited;
})();
Digits.prototype.draw = function() {
    value_str = this.value.toString();
    start_x = this.x;
    this.x = this.x - 24;
    for( i = value_str.length - 1; i >= 0; i-- ) {
        ascii = value_str.charCodeAt(i);
        this.setImage(this.frames[ascii-48]);
        jaws.Sprite.prototype.draw.call(this);
        this.x = this.x - 24;
    }
    this.x = start_x;
}
 
/*
 * -----------------------------------------------------------------------------
 * Explosion class, to handle explosion animations. Inherits from jaws.Sprite.
 * -----------------------------------------------------------------------------
 */
Explosion = function(options, game) {
    // Call the inherited constructor.
    this.constructor(options);
    // Keep a reference to the main game context object.
    this.game = game;
    // Load the animation
    imagefile = "graphics/explosion_01.png";
    this.anim = new jaws.Animation({sprite_sheet: imagefile, frame_size: [20, 20], frame_duration: 100, loop: 0})
    this.done = false;
}
// Constructor, to enable inheritance.
Explosion.prototype = (function() {
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.Sprite.prototype;
    inherited.prototype.parent = jaws.Sprite.prototype;
    return new inherited;
})();
Explosion.prototype.update = function() {
    // Set the animation image
    this.setImage(this.anim.next());
    // Note if we have reached the end of the animation
    if(this.anim.index >= this.anim.frames.length - 1) {
        this.done = true;
    }
}

/*
 * -----------------------------------------------------------------------------
 * Detonator class, to handle multiple explosions. Inherits from jaws.SpriteList.
 * -----------------------------------------------------------------------------
 */
Detonator = function(game) {
    // Call the inherited constructor.
    this.constructor();
    // Keep a reference to the main game context object.
    this.game = game;
}
// Constructor, to enable inheritance.
Detonator.prototype = (function() {
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.SpriteList.prototype;
    return new inherited;
})();
Detonator.prototype.explode = function(at_x, at_y) {
    explosion = new Explosion({x: at_x, y: at_y}, this.game);
    this.push(explosion);
}
Detonator.prototype.update = function() {
    jaws.SpriteList.prototype.update.call(this);
    this.removeIf(function(explosion) {
        return explosion.done;
    });
}

/*
 * -----------------------------------------------------------------------------
 * Paddle class, handling the player's paddle. Inherits from jaws.Sprite.
 * -----------------------------------------------------------------------------
 */
Paddle = function(options, game) {
    // Call the inherited constructor.
    this.constructor(options);
    // Keep a reference to the main game context object.
    this.game = game;
    // Set up the basic parameters
    this.speed = 10;
    this.hits = 10; // How many hits from blocks before the paddle is destroyed?
    // Load the images
    imagefile = "graphics/paddle_01.png";
    sprite_sheet = new jaws.SpriteSheet({image: imagefile, frame_size: [120, 20]});
    this.frames = sprite_sheet.frames;
    this.setImage(this.frames[10 - this.hits]);
    this.width = 120;
    
    this.thrust_left = 0;
    this.thrust_right = 0;
}
// Constructor, to enable inheritance.
Paddle.prototype = (function(){
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.Sprite.prototype;
    return new inherited;
})();
// Checks for key-presses and collisions
Paddle.prototype.update = function() {
    // Move the paddle via the left and right arrow keys
    if ((jaws.pressed("left")) && (this.thrust_left < 10)) {
        this.thrust_left = this.thrust_left + 1;
    } else if (this.thrust_left > 0) {
        this.thrust_left--;
    }
    if ((jaws.pressed("right")) && (this.thrust_right < 10)) {
        this.thrust_right = this.thrust_right + 1;
    } else if (this.thrust_right > 0) {
        this.thrust_right--;
    }
    this.x += this.thrust_right - this.thrust_left;
    if (this.x < 0) {
        this.x = 0;
        this.thrust_left = 0;
    }
    if (this.x > (400 - this.width)) {
        this.x = 400 - this.width;
        this.thrust_right = 0;
    }
    this.setImage(this.frames[10 - this.hits]);
}
// Increments the damage state of the paddle
Paddle.prototype.damage = function() {
    this.hits--;
    jaws.log(this.hits);
    if (this.hits < 0) {
        this.hits = 0;
    }
    if (this.hits == 0) {
        this.game.state = this.game.params.G_OVER;
        this.game.gameTrack.pause();
        this.game.menuTrack.play();
    }
}

/*
 * -----------------------------------------------------------------------------
 * Bullet class, handling the individual bullets. Inherits from jaws.Sprite.
 * -----------------------------------------------------------------------------
 */
Bullet = function(options, game, type) {
    var imagefile;
    // Call the inherited constructor.
    this.constructor(options);
    // Keep a reference to the main game context object.
    this.game = game;
    this.type = type;
    // Load the image
    if (this.type == 2) {
        imagefile = "graphics/bullet_02.png";
    } else {
        imagefile = "graphics/bullet_01.png";
    }
    this.frames = new jaws.Animation({sprite_sheet: imagefile, frame_size: [20, 20], frame_duration: 250})
    // Set up the basic parameters
    if (this.type == 2) {
        this.speed = B_SPEED_NORMAL + Math.floor(Math.random() * 6);
        this.xdir = this.speed;
        this.ydir = this.speed;
    } else {
        this.speed = B_SPEED_NORMAL;
        this.xdir = - this.speed;
        this.ydir = - this.speed;
    }
}
// Constructor, to enable inheritance.
Bullet.prototype = (function(){
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.Sprite.prototype;
    return new inherited;
})();
// Override of move() method.
Bullet.prototype.move = function() {
    if(!this.offscreen()) {
        if (this.game.slowdn_countdown.active) {
            x = this.xdir * 0.5;
            y = this.ydir * 0.5;
        } else {
            x = this.xdir;
            y = this.ydir;
        }
        jaws.Sprite.prototype.move.call(this, x, y);
        if ( this.hitYEdge() ) {
            this.ydir = this.speed;
        }
        if ( this.hitXEdge() ) {
            this.xdir = -this.xdir;
        }
    }
}
// Did the bullet hit a vertical edge?
Bullet.prototype.hitYEdge = function() {
    return (( this.y ) < this.game.board.y ); 
}
// Did the bullet hit a horizontal edge?
Bullet.prototype.hitXEdge = function() {
    return ((( this.x ) < this.game.board.x ) || (( this.x + 10 ) > this.game.board.right ));
}
// Did the bullet go off-screen?
Bullet.prototype.offscreen = function() {
    return (this.y > this.game.board.bottom);
}
// Update the bullet's position
Bullet.prototype.update = function() {
    this.setImage(this.frames.next());
    this.move(); 
}
// Check for the bullet striking the paddle
Bullet.prototype.checkHitPaddle = function() {
    // Only collide if the bullet is travelling down the screen.
    if(this.ydir > 0) {
        if( jaws.collideOneWithOne( this, this.game.paddle ) ) { 
            this.ydir = - this.ydir;
            if(this.y > this.game.paddle.y) {
                // The bullet hit the edge of the paddle -- make it bounce back
                this.xdir = - this.xdir;
            }
            else
            {
                
            }
            this.game.score += (1 * S_BONUS);
        }
    }
}        

/*
 * -----------------------------------------------------------------------------
 * Cannon class - handles all the bullets in the game. Inherits from
 * jaws.SpriteList.
 * -----------------------------------------------------------------------------
 */
Cannon = function(game) {
    // Call the inherited constructor.
    this.constructor();
    // Keep a reference to the main game context object.
    this.game = game;
}
// Constructor, to enable inheritance.
Cannon.prototype = (function() {
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.SpriteList.prototype;
    return new inherited;
})();
// Setup the Cannon -- start with a single bullet.
Cannon.prototype.setup = function() {
    // Clear the existing array (in case we are re-starting)
    this.sprites.length = 0;
    this.fire(200, this.game.board.bottom - 48, 0);
}
// Add the supplied bullet to the list of sprites.
Cannon.prototype.add = function( bullet ) {
    this.push( bullet );
}
// Check for collisions between the bullets and the player's paddle or any
// blocks in the tunnel walls.
Cannon.prototype.checkForHits = function() {
    this.forEach(function(bullet) {
        bullet.checkHitPaddle();
        bullet.game.builder.checkForHits( bullet );
    })
}
// Are there any bullets still on-screen?
Cannon.prototype.has_bullets = function() {
    return (this.length > 0);
}

// Move the bullets, remove any which go off-screen, and check for collisions.
Cannon.prototype.update = function() {
    this.forEach(function(bullet) {
            bullet.update();
    });
    this.removeIf(function(bullet) {
            return bullet.offscreen();
    });
    this.checkForHits( );
}
// Launch a new bullet.
Cannon.prototype.fire = function(startx, starty, type) {
    bullet = new Bullet( { x: startx, y: starty }, this.game, type );
    bullet.ydir = -bullet.speed;
    this.push( bullet );
}

/*
 * -----------------------------------------------------------------------------
 * TunnelBlock class, representing one wall block. Inherits from jaws.Sprite.
 * -----------------------------------------------------------------------------
 */
TunnelBlock = function(options, game) {
    // Call the inherited constructor.
    this.constructor(options);
    // Keep a reference to the main game context object.
    this.game = game;
    this.base_y = this.y;
    this.type = 0;
}
// Constructor, to enable inheritance.
TunnelBlock.prototype = (function(){
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.Sprite.prototype;
    return new inherited;
})();

/*
 * -----------------------------------------------------------------------------
 * TunnelWall class, handling one wall of blocks. Inherits from jaws.SpriteList.
 * -----------------------------------------------------------------------------
 */
TunnelWall = function(game, y) {
    // Call the inherited constructor.
    this.constructor();
    // Keep a reference to the main game context object.
    this.game = game;
    this.y = y;
}
// Constructor, to enable inheritance.
TunnelWall.prototype = (function(){
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.SpriteList.prototype;
    return new inherited;
})();
// Creates the blocks for the wall.
TunnelWall.prototype.setup = function(blueprint) {
    rows = blueprint.split("\n");
    rowcount = rows.length;
    for( i = 0; i < 40; i += 1 ) { 
        for( j = 0; j < rowcount; j ++ ) {
            blockchar = rows[j].charAt(i);
            switch (blockchar) {
               case '.':
                  block = new TunnelBlock( { image: this.game.params.block_images[this.game.params.B_STND], x: (i * 40) - 5, y: 0 + ( j * 20 )} );
                  block.type = this.game.params.B_STND;
                  break;
               case '+':
                  block = new TunnelBlock( { image: this.game.params.block_images[this.game.params.B_GROW], x: (i * 40) - 5, y: 0 + ( j * 20 )} );
                  block.type = this.game.params.B_GROW;
                  break;
               case '*':
                  block = new TunnelBlock( { image: this.game.params.block_images[this.game.params.B_MULT], x: (i * 40) - 5, y: 0 + ( j * 20 )} );
                  block.type = this.game.params.B_MULT;
                  break;
               case 'o':
                  block = new TunnelBlock( { image: this.game.params.block_images[this.game.params.B_BOMB], x: (i * 40) - 5, y: 0 + ( j * 20 )} );
                  block.type = this.game.params.B_BOMB;
                  break;
               case '#':
                  block = new TunnelBlock( { image: this.game.params.block_images[this.game.params.B_FIXT], x: (i * 40) - 5, y: 0 + ( j * 20 )} );
                  block.type = this.game.params.B_FIXT;
                  break;
               case '>':
                  block = new TunnelBlock( { image: this.game.params.block_images[this.game.params.B_SPED], x: (i * 40) - 5, y: 0 + ( j * 20 )} );
                  block.type = this.game.params.B_SPED;
                  break;
               case '<':
                  block = new TunnelBlock( { image: this.game.params.block_images[this.game.params.B_SLOW], x: (i * 40) - 5, y: 0 + ( j * 20 )} );
                  block.type = this.game.params.B_SLOW;
                  break;
               case '^':
                  block = new TunnelBlock( { image: this.game.params.block_images[this.game.params.B_SUPR], x: (i * 40) - 5, y: 0 + ( j * 20 )} );
                  block.type = this.game.params.B_SUPR;
                  break;
               default:
                  block = null;
                  break;
            }
            if (block) {
                this.push( block ); 
            }
        } 
    } 
}
// placeBlock() - places the block into a position vertically offset from the
// TunnelWall top.
TunnelWall.prototype.placeBlock = function( block ) {
    // The block's position is offset from the current top position of the wall.
    block.y = this.y + block.base_y;
    if (block.y > 600) {
        delete block;
    }
}
// Updates the blocks.
TunnelWall.prototype.update = function() {
    var that = this;
    if (this.game.speedup_countdown.active) {
        this.y = this.y + W_SPEED_FAST;
    } else {
        this.y = this.y + W_SPEED_NORMAL;
    }
    this.forEach( function(item) { that.placeBlock(item) } );
}
// Checks for collisions between the supplied bullet and the blocks.
TunnelWall.prototype.checkForHits = function( bullet ) {
    // Get a list of all the blocks that were struck by the bullet.
    struckBlocks = jaws.collideOneWithMany( bullet, this ); 
    // Check each struck block.
    any_struck = false;
    for( i = 0; i < struckBlocks.length; i ++ ) {
        block = struckBlocks[i];
        // Tricky: because of the collision-detection area, if a bullet 
        // 'bounces' off a block, it might still register as colliding on the
        // next update (as it is still close enough to the block), which would
        // result in it bouncing back again (a very odd-looking effect!). So
        // we will check that the block that is being collided with is actually
        // 'ahead' of the bullet.
        struck = false;
        if (((bullet.ydir > 0) && (block.y > bullet.y)) || ((bullet.ydir < 0) && (block.y < bullet.y))) {
            struck = true;
            any_struck = true;
        }
        if (struck) {
            // Handle any power-up blocks
            switch (block.type) {
                case this.game.params.B_MULT:
                    this.game.cannon.fire(block.x, block.y, 2);            
                    this.game.cannon.fire(block.x, block.y, 2);
                    break;
                case this.game.params.B_GROW:
                    /*
                    this.game.paddle.setImage("graphics/paddle_1b.png");
                    this.game.paddle.setWidth(120);
                    */
                    break;
                case this.game.params.B_SUPR:
                    this.game.super_bullet_countdown.start(5);
                    break;
                case this.game.params.B_BOMB:
                    this.game.builder.destroy();
                    break;
                case this.game.params.B_SPED:
                    this.game.speedup_countdown.start(10);
                    break;
                case this.game.params.B_SLOW:
                    this.game.slowdn_countdown.start(10);
                    break;
            }
            // Remove the block unless it is a fixed one, or if the super-bullet
            // is active.
            if ((block.type != this.game.params.B_FIXT) || (this.game.super_bullet_countdown.active)) {
                this.game.detonator.explode(bullet.x, bullet.y);
                if (block.type == this.game.params.B_FIXT) {
                    this.game.score += (100 * S_BONUS);
                } else {
                    this.game.score += (10 * S_BONUS);
                }
                this.remove( struckBlocks[i] );
            }
        }
    }
    // If any blocks were struck, bounce the bullet, unless super-bullet is
    // active.
    if(( any_struck ) && ( !this.game.super_bullet_countdown.active )) { 
        bullet.ydir = - bullet.ydir; 
    }
}        

// Checks for collisions between the paddle and the blocks.
TunnelWall.prototype.checkForPaddleHits = function( ) {
    // Get a list of all the blocks that were struck by the paddle.
    struckBlocks = jaws.collideOneWithMany( this.game.paddle, this ); 
    for( i = 0; i < struckBlocks.length; i ++ ) {
        block = struckBlocks[i];
        // Destroy the block, and damage the paddle
        this.game.detonator.explode(block.x, block.y);
        this.game.detonator.explode(block.x, block.y + Math.floor(Math.random()*10));
        this.game.detonator.explode(block.x + Math.floor(Math.random()*10), block.y);
        this.game.detonator.explode(block.x + Math.floor(Math.random()*10), block.y + Math.floor(Math.random()*10));
        this.remove( struckBlocks[i] );
        this.game.paddle.damage();
    }
}

// Destroys all visible blocks
TunnelWall.prototype.destroy = function() {
    // Get a list of all the blocks that were struck by the bullet.
    struckBlocks = jaws.collideOneWithMany( this.game, this ); 
    for( i = 0; i < struckBlocks.length; i ++ ) {
        block = struckBlocks[i];
        // Destroy the block
        this.game.detonator.explode(block.x, block.y);
        this.game.detonator.explode(block.x, block.y + Math.floor(Math.random()*10));
        this.game.detonator.explode(block.x + Math.floor(Math.random()*10), block.y);
        this.game.detonator.explode(block.x + Math.floor(Math.random()*10), block.y + Math.floor(Math.random()*10));
        this.remove( struckBlocks[i] );
    }
}

/*
 * Blueprint class - maintains a list of the 'wall' blueprints.
 */

function Blueprint(game) {
    this.game = game;
    this.sheets = [];
    this.current = -1;
    
    this.setup = function() {
        this.sheets.length = 0;
        this.current = -1;

        // Blueprint 1        
        sheet = "..........";
        this.sheets.push(sheet.slice(0));
        
        // Blueprint 2
        sheet = "..........\n" +
                "..........";
        this.sheets.push(sheet.slice(0));
        
        // Blueprint 3
        sheet = "....*.....\n" +
                ".#......#.";
        this.sheets.push(sheet.slice(0));
        
        // Blueprint 4
        sheet = ".#..*...#.\n" +
                ".#.#^#..#.";
        this.sheets.push(sheet.slice(0));
        
        // Blueprint 5
        sheet = ".#......#.\n" +
                "..#.o.#...\n" +
                ".#..<...#.";
        this.sheets.push(sheet.slice(0));
        
        // Blueprint 6
        sheet = ".#..*...#.\n" +
                "..#...#...\n" +
                ".#..^...#.";
        this.sheets.push(sheet.slice(0));
        
        // Blueprint 7
        sheet = "   #...#  \n" +
                "..#..>..#.\n" +
                "   #.^.#  ";
        this.sheets.push(sheet.slice(0));
        
        // Blueprint 8
        sheet = ".#..*...#.\n" +
                ".^..^...^.";
        this.sheets.push(sheet.slice(0));
        
        // Blueprint 9
        sheet = ".#..o...#.\n" +
                "..#....#..";
        this.sheets.push(sheet.slice(0));
        
        // Blueprint 10
        sheet = ".#.^..^.#.\n" +
                "..#....#..";
        this.sheets.push(sheet.slice(0));
        
    }
    
    this.next = function() {
        this.current = this.current + 1;
        if (this.current > this.sheets.length - 1) {
            // this.current = this.sheets.length - 1;
            this.current = Math.floor(Math.random() * 10)
        }
        return this.sheets[this.current];
    }
}

/*
 * -----------------------------------------------------------------------------
 * WallBuilder class - handles all the TunnelWalls in the game.
 * -----------------------------------------------------------------------------
 */
function WallBuilder( game ) {
    this.game = game;
    this.walls = [];
    this.last_wall_top = 0;
    this.wall_separation = 500;
    this.blueprint = new Blueprint(this.game);
    this.wallcount = 0;

    // Set up -- create the first walls.    
    this.setup = function( ) {
        this.wallcount = 0;
        this.blueprint.setup();
        // Clear the existing array, in case we are re-starting.
        this.walls.length = 0;
        wall = new TunnelWall(game, 200.0);
        wall.setup(this.blueprint.next());
        this.walls.push(wall);
        wall = new TunnelWall(game, 0);
        wall.setup(this.blueprint.next());
        this.walls.push(wall);
    }
    
    // Update all the walls.
    this.update = function( ) {
        // Remove walls which have no more blocks.
        if (this.walls.length > 0) {
            if (this.walls[0].length == 0) {
                wall = this.walls.shift();
                delete wall;
            }
        }
        // Is it time for another wall?
        this.last_wall_top += W_SPEED_NORMAL;
        if (this.game.speedup_countdown.active) {
            this.last_wall_top += W_SPEED_FAST;
        } else {
            this.last_wall_top += W_SPEED_NORMAL;
        }
        if (this.last_wall_top > this.wall_separation) {
            // Yes!
            wall = new TunnelWall(game, 0.0);
            wall.setup(this.blueprint.next());
            this.walls.push(wall);
            this.last_wall_top = 0;
            W_SPEED_NORMAL += 0.01;
            W_SPEED_FAST += 0.01;
            this.wallcount++
            if (this.wallcount = 11) {
                S_BONUS = S_BONUS + 1;
            }
        }
        // Update each remaining wall in turn.
        this.walls.forEach( function(wall) { wall.update(); } );
    }

    // Check for any collisions between the bullet and the blocks in any of
    // the walls.
    this.checkForHits = function( bullet ) {
        // Use the TunnelWall's function to do the actual checking.
        this.walls.forEach( function(wall) { wall.checkForHits( bullet ); } );
        // Check for hits with the paddle as well.
        this.walls.forEach( function(wall) { wall.checkForPaddleHits(); } );
    }

    // Draw the walls.
    this.draw = function() {
        this.walls.forEach( function(wall) { wall.draw(); } );
    }
    
    // Destroys all visible blocks
    this.destroy = function() {
        this.walls.forEach( function(wall) { wall.destroy(); } );
    }
}

/*
 * -----------------------------------------------------------------------------
 * Timer class - keeps track of the duration of the game.
 * -----------------------------------------------------------------------------
 * This class has to be slightly tricky because it needs to accommodate the game
 * pausing (when the browser tab loses focus, for example) and to continue the
 * timing correctly when it is unpaused.
 */

function Timer() {
    this.seconds = 0;
    this.counter = -1;
    
    this.setup = function() {
        this.seconds = 0;
        this.last_tick = jaws.game_loop.current_tick;
        this.last_counter_tick = 0;
    }
    this.update = function() {
        next_tick = jaws.game_loop.current_tick;
        // Check the difference between the last tick and the current tick. If
        // it amounts to 1 second or more, assume that 1 second has passed. This
        // means that if multiple seconds have passed (because the game has been
        // paused), it will still only count as a single second. This is not
        // exactly accurate, but works well enough for the game.
        if (Math.floor((next_tick - this.last_tick) / 1000) >= 1) {
            this.last_tick = next_tick;
            this.seconds++;
        }
        if (this.counter >= 0) {
            if (Math.floor((next_tick - this.last_counter_tick) / 1000) >= 1) {
                this.last_counter_tick = next_tick;
                this.counter++;
            }
        }
    }
    // Starts a counter, taking the current second as 0 and counting up each
    // second.
    this.start_counter = function() {
        this.counter = 0;
        this.last_counter_tick = jaws.game_loop.current_tick;
    }
    // Stops the counter.
    this.stop_counter = function() {
        this.counter = -1;
    }
    // Returns True if the counter is active.
    this.active = function() {
        return (this.counter != -1);
    }
}

/*
 * Countdown class - provides a 'seconds' countdown.
 */
function Countdown() {
    this.counter = -1;
    this.active = false;
    this.expired = false;
    this.last_tick = 0;
    
    this.update = function() {
        if (this.active) {
            if (this.counter >= 0) {
                if (Math.floor((next_tick - this.last_tick) / 1000) >= 1) {
                    this.last_tick = next_tick;
                    this.counter--;
                    if (this.counter <= 0) {
                        this.expired = true;
                        this.counter = -1;
                    }
                }
            }
        }
    }
    
    this.start = function(seconds) {
        this.counter = seconds;
        this.active = true;
        this.expired = false;
    }
    
    this.stop = function() {
        this.counter = -1;
        this.active = false;
        this.expired = false;
    }
}

/*
 * -----------------------------------------------------------------------------
 * Game class - encapsulates the game context, containing instances of the
 * other objects that make up the game, allowing them access to each other.
 * -----------------------------------------------------------------------------
 */ 
function Game() {
    this.score = 0;
    this.params = new Params();
    this.state = this.params.G_READY;
    this.detonator = new Detonator();
    this.timer = new Timer();
    this.score_display = new Digits({x: s_x, y: s_y}, this);
    this.score_display.value = 0;
    this.bullet_countdown = new Countdown();
    this.bullet_countdown_digit = new Digit({x: nbd_x, y: nbd_y}, this);
    this.super_bullet_countdown = new Countdown();
    this.speedup_countdown = new Countdown();
    this.slowdn_countdown = new Countdown();
    this.board = new jaws.Rect(0, 128, 400, 600);
    this.paddle = new Paddle( { image: "graphics/paddle_01.png", x: 140, y: this.board.bottom - 28 }, this );
    this.builder = new WallBuilder( this );
    this.cannon = new Cannon( this );
    this.frame = new jaws.Sprite( { image: "graphics/frame_01.png", x: 0, y: 0 } );
    this.game_start = new jaws.Sprite( { image: "graphics/game_start_01.png", x: 0, y: 128 } );
    this.game_over = new jaws.Sprite( { image: "graphics/game_over_01.png", x: 0, y: 128 } );
    
    this.setupMusic = function() {
        W_SPEED_NORMAL = 0.2;
        W_SPEED_FAST = 0.5;
        this.menuTrack = new Audio("sounds/DST-Blanket.ogg");
        this.gameTrack = new Audio("sounds/DST-BreakIt.ogg");
        this.menuTrack.addEventListener("ended", function() {
            this.currentTime = 0;
            this.play();
        }, false);
        this.gameTrack.addEventListener("ended", function() {
            this.currentTime = 0;
            this.play();
        }, false);
    }
    
    this.setup = function( ) {
        jaws.preventDefaultKeys( ["space", "left", "right"] );
        this.score = 0;
        this.score_display.value = 0;
        this.builder.setup();
        this.cannon.setup();
        this.timer.setup();
        this.paddle.hits = 10;
        if(!this.menuTrack) {
            this.setupMusic();
        }
        this.menuTrack.play();
    }
    
    this.update = function( ) {
        switch(this.state) {
            case this.params.G_READY:
                if (jaws.pressed("space")) {
                    this.state = this.params.G_ACTIVE;
                    this.menuTrack.pause();
                    this.gameTrack.play();
                }
                break;
            case this.params.G_ACTIVE:
                this.builder.update();
                this.cannon.update();
                this.paddle.update();
                this.timer.update();
                this.bullet_countdown.update();
                this.super_bullet_countdown.update();
                this.speedup_countdown.update();
                this.slowdn_countdown.update();
                this.detonator.update();
                this.score_display.value = this.score;
                break;
            case this.params.G_OVER:
                this.detonator.update();
                if (jaws.pressed("space")) {
                    this.setup();
                    this.state = this.params.G_ACTIVE;
                    this.menuTrack.pause();
                    this.gameTrack.play();
                }
                break;
        }
    }
    
    this.draw = function( ) {
        switch(this.state) {
            case this.params.G_READY:
                this.builder.draw();
                this.paddle.draw();
                this.game_start.draw();
                break;
            case this.params.G_ACTIVE:
                this.builder.draw();
                this.cannon.draw();
                this.paddle.draw();
                this.detonator.draw();
                break;
            case this.params.G_OVER:
                this.builder.draw();
                this.paddle.draw();
                this.detonator.draw();
                this.game_over.draw();
                break;
        }
        this.frame.draw();
        this.score_display.draw();
    }
    
    this.rect = function() {
        return this.board;
    }
}

function TunnelBlast( ) {
    this.game = new Game();
    
    // HTML element for the FPS display     
    this.fps_label = document.getElementById( "fps" );
    // HTML elements for the 'seconds' display
    this.timer_label = document.getElementById( "timer" );
    // Scrolling background
    this.parallax; 
    
    this.newbullet;
    this.newbullet_delay = 5;

    this.canvas  = document.getElementById("board");
    this.context = this.canvas.getContext("2d");

    this.context.font      = "bold 18px Verdana";
    this.context.fillStyle = "#00c0ff";

    /* setup() - initialises the game */    
    this.setup = function( ) { 
        this.game.setup();
        this.parallax = new jaws.Parallax( { repeat_y: true } ); 
        this.parallax.addLayer( { image: "graphics/floor_01.png", damping: 20 } ); 
        this.newbullet = new jaws.Sprite( { image: "graphics/newbullet_01.png", x: nb_x, y: nb_y } );
    }
    
    /* update() - updates the game, handles key-presses, etc. */
    this.update = function( ) { 
        // Scroll the background
        this.parallax.camera_y -= 1; 

        if (!jaws.game_loop.paused) {
            if (!document.hasFocus()) {
                jaws.game_loop.pause();
                setTimeout(this.release_pause, 200);
            }
            else
            {
                this.game.update( );
                
                // Update the FPS display
                if (this.fps_label) {
                    this.fps_label.innerHTML = jaws.game_loop.fps;
                }
                
                // Update the timer display
                if (this.timer_label) {
                    this.timer_label.innerHTML = this.game.timer.seconds;
                }
                
                // If we are waiting to fire a new bullet
                if (this.game.bullet_countdown.expired) {
                    this.game.bullet_countdown.stop();
                    this.game.cannon.fire(this.game.paddle.x + (this.game.paddle.width / 2), this.game.board.bottom - 48, 0);
                } else if (this.game.bullet_countdown.active) {
                } else if (!this.game.cannon.has_bullets()) {
                    this.game.bullet_countdown.start(this.newbullet_delay);
                }
                
                // If the super-bullet countdown has expired.
                if (this.game.super_bullet_countdown.expired) {
                    this.game.super_bullet_countdown.stop();
                }
                
                // If the speed-up countdown has expired.
                if (this.game.speedup_countdown.expired) {
                    this.game.speedup_countdown.stop();
                }
                
                // If the slow-down countdown has expired.
                if (this.game.slowdn_countdown.expired) {
                    this.game.slowdn_countdown.stop();
                }
            }
        }
        else {
            if (document.hasFocus()) {
                jaws.game_loop.unpause();
            }
        }
    }
    
    this.release_pause = function() {
        jaws.game_loop.unpause();
    }
    
    /* draw() - draws the game components on the canvas. */
    this.draw = function( ) { 
        this.parallax.draw( ); 
        this.game.draw( );
        if ( !this.game.cannon.has_bullets() ) {
            this.newbullet.draw( );
            this.game.bullet_countdown_digit.digit = this.game.bullet_countdown.counter;
            this.game.bullet_countdown_digit.update();
            this.game.bullet_countdown_digit.draw();
        }
    } 
}
jaws.onload = function( ) {
    // Pre-load the game assets
    jaws.assets.add( [ 
        "graphics/frame_01.png",
        "graphics/floor_01.png",
        "graphics/paddle_01.png", 
        "graphics/bullet_01.png", 
        "graphics/bullet_02.png", 
        "graphics/block_00.png", 
        "graphics/block_01.png", 
        "graphics/block_02.png", 
        "graphics/block_03.png", 
        "graphics/block_04.png", 
        "graphics/block_05.png", 
        "graphics/block_06.png", 
        "graphics/block_07.png", 
        "graphics/explosion_01.png",
        "graphics/digits_blue_01.png",
        "graphics/digits_red_01.png",
        "graphics/game_start_01.png",
        "graphics/game_over_01.png"
    ] ); 
    // Start the game running. jaws.start() will handle the game loop for us.
    jaws.start( TunnelBlast ); 
}
