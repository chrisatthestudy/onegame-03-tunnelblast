# Tunnel Blast - OneGameAMonth - March 2013

## Overview

This game is a sort of hybrid between Breakout and Space Invaders, where the
player has to blast away blocks from a slowly descending collection of blocks,
to make a hole large enough for the player's paddle to pass through.

At the start of the game the player only has one 'bullet', which bounces off
the blocks and walls, and can be re-launched if it goes off the bottom of the
screen (unlike Breakout, this does not lose a life).

Some blocks release power-ups when struck.

## Technical Notes

Because I come from an object-oriented background, and because Javascript
superficially appears to be an object-oriented language (I eventually learnt
better), I made an ill-advised attempt to write this in an object-oriented
fashion, complete with inheritance -- the clumsy and unintuitive prototype
'constructor' routine which appears in most of the objects is the centre of
this.

## Dependencies

* [jaws - Javascript graphics library](https://github.com/ippa/jaws)

I've included the library in the src directory so that this project contains
the correct version of it, in case later versions introduce breaking changes
(though as it hasn't been updated recently, this seems unlikely).


