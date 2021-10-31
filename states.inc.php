<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * binaryHomeworlds implementation : © <Jonathan Baker> <babamots@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 * states.inc.php
 *
 * binaryHomeworlds game states description

action:
    Name of a PHP function to call on entry to this state.
    These traditionally start with st
    In the case of the starting state, there's no stGameSetup function 
    but it exists somewhere in code hidden from developers.

args:
    Name of a function that will produce parameters to pass to
    the JS function onEnteringState when this state is enteted.

name:
    Name of the state.

type:
    One of
        manager (for start/end state),
        game (a processing state with no active players),
        activeplayer (a state waiting for one player to move),
        multipleactiveplayer (a state waiting for multiple players to move)

description:
    Text to appear in status bar.
    You can update this description with some trickery
    See "Changing state prompt" on
    https://en.doc.boardgamearena.com/BGA_Studio_Cookbook

descriptionmyturn:
    Text to appear in status bar for the active player(s)

transitions:
    An array mapping transition names to state ids

possibleactions:
    An array of the names of possible actions that the player could take
    These are NOT the same as transitions
    TODO
    When I figure out exactly how they're used, I should expand this note

updateGameProgression:
    true or false (false is default)
    Set to true if you want the getGameProgression() function to be called
 */

$machinestates = array(

    // The initial state.
    // Please do not modify.
    1 => array(
        'name' => 'gameSetup',
        'description' => '',
        'type' => 'manager',
        'action' => 'stGameSetup',
        // 'transitions' => array( '' => 10 )
        // TODO switch back after testing
        'transitions' => array( '' => 11 )
    ),
/*
    //////////////////////
    // Get player input //
    //////////////////////
    10 => array(
        'name' => 'get_creation',
        'description' => clienttranslate('${actplayer} must create a homeworld.'),
        'descriptionmyturn' => clienttranslate('${you} must choose a homestar.'),
        'type' => 'activeplayer',
        'possibleactions' => array( 'act_creation' ),
        'transitions' => array( 'trans_after_creation' => 20 )
    ),
    11 => array(
        // TODO an args function should provide catastrophe options
        'name' => 'get_free',
        'description' => clienttranslate('${actplayer} must empower a friendly ship.'),
        'descriptionmyturn' => clienttranslate('${you} must choose a friendly ship.'),
        'type' => 'activeplayer',
        'possibleactions' => array( 'act_power_action' ),
        'transitions' => array(
            'trans_after_free' => 21,
            'trans_pass' => 30
        )
    ),
    ///////////////////
    // Process input //
    ///////////////////
    20 => array(
        'name' => 'after_creation',
        'type' => 'game',
        'action' => 'st_after_creation',
        'transitions' => array(
            'trans_get_creation' => 10 ,
            'trans_get_free' => 11
        )
    ),
    21 => array(
        'name' => 'after_free',
        'type' => 'game',
        'action' => 'st_after_free',
        'transitions' => array(
            // TODO Allow catastrophe
            'trans_end_turn' => 30
        )
    ),
    30 => array(
        'name' => 'end_turn',
        'type' => 'game',
        'action' => 'st_end_turn',
        'transitions' => array(
            'trans_get_free' => 11 ,
            'trans_endGame' => 99
        )
    ),
*/
    // Final state
    // Please do not modify and do not overload action/args methods
    99 => array(
        'name' => 'gameEnd',
        'description' => clienttranslate('End of game'),
        'type' => 'manager',
        'action' => 'stGameEnd',
        'args' => 'argGameEnd'
    )
);
