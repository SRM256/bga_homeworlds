/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * binaryHomeworlds implementation : © <Jonathan Baker> <babamots@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * binaryhomeworlds.js
 *
 * binaryHomeworlds user interface script
 *
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

define([
    "dojo",
    "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter"
],
function (dojo, declare) {
    return declare( "bgagame.binaryhomeworlds", ebg.core.gamegui, {
        constructor: function(){
            console.log('binaryhomeworlds constructor');
        },

        /*
        setup:

        This method must set up the game user interface according to
        current game situation specified in parameters.

        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)

        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
        */
        setup: function( gamedatas ) {
            console.log( "Starting game setup" );
            console.log(gamedatas);
            ///////////////////
            // Create pieces //
            ///////////////////
            var colornum,pipsnum;
            var params;
            var piece_id,stack_id;
            // Create bank pieces
            for(piece_id in gamedatas.bank){
                piece = gamedatas.bank[piece_id];
                stack_id = 'stack_'+piece.color+'_'+piece.pips;
                this.setup_piece(piece,'banked',stack_id);
            }
            // Create systems and their pieces
            for(system_id in gamedatas.systems) {
                this.setup_system(gamedatas.systems[system_id]);
            }

            // It seems like cheating,
            // but I'm going to record player numbers in "this."
            // This will make it easier to have the spectator view match
            // the view of the south player.
            var player;
            for(var player_id in gamedatas.players){
                player = gamedatas.players[player_id];
                this['player_'+player.player_no] = player_id;
            }
            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();
            console.log( "Ending game setup" );
        },

        ///////////////////////////////////////////////////
        //// Game & client states

        // onEnteringState:
        // This method is called each time we are entering into a new game state.
        // You can use this method to perform user interface changes.
        onEnteringState: function( state_name, args ) {
            console.log('Entering state: ' + state_name, args);
            // Current player saves most recent info from server
            // to make it easier to cancel partial actions from client states.
            // All server-side player-decision states start with "want"
            if(this.isCurrentPlayerActive() && state_name.startsWith('want'))
                this.set_turn_checkpoint(args,state_name);
            // Call appropriate method
            var methodName = 'onEntering_' + state_name;
            if (this[methodName] !== undefined)
                this[methodName](args.args);
        },

        onEntering_want_creation: function(args){
            if(!this.isCurrentPlayerActive())
                return
            var stacks = dojo.query('.stack');
            stacks.addClass('selectable');
            this.connectClass('selectable','onclick','stack_selected_creation');
            // You could instead use
            //stacks.connect('onclick',this,'stack_selected_creation' );
            // but then this.disconnect wouldn't work
        },

        onEntering_want_free: function(args){
            if(!this.isCurrentPlayerActive())
                return
            var ships = dojo.query('.ship.friendly');
            ships.addClass('selectable');
            this.connectClass(
                'selectable',
                'onclick',
                function(evt){
                    evt.preventDefault();
                    dojo.stopEvent(evt);
                    this.empower_ship(evt.currentTarget);
                }
            );
        },

        onEntering_want_sacrifice_action: function(args){
            if(!this.isCurrentPlayerActive())
                return
            var ships = dojo.query('.ship.friendly');
            ships.addClass('selectable');
            this.connectClass(
                'selectable',
                'onclick',
                function(evt){
                    evt.preventDefault();
                    dojo.stopEvent(evt);
                    this.empower_ship(evt.currentTarget,args.color);
                }
            );
        },

        onEntering_client_want_power: function(args){
            if(!this.isCurrentPlayerActive())
                return
            var empowerednode = dojo.query('[empower]')[0];
            // The system that the empowered ship is in
            var systemnode = empowerednode.parentNode;
            // Candidates for empowering technology
            var candidates = dojo.query('.star,.friendly.ship',systemnode);
            candidates.addClass('selectable');
            this.connectClass(
                'selectable',
                'onclick',
                function(evt){
                    evt.preventDefault();
                    dojo.stopEvent(evt);
                    var shipnode = evt.currentTarget;
                    var powernode = evt.currentTarget;
                    var color = powernode.getAttribute('ptype').split('_')[0];
                    this.power_selected(color);
                });
        },

        onEntering_client_want_target: function(args){
            if(!this.isCurrentPlayerActive())
                return
            var empowerednode = dojo.query('[empower]')[0];
            var power = empowerednode.getAttribute('empower');
            var targets = this.power_targets(empowerednode,power);
            targets.addClass('selectable');
            this.connectClass('selectable','onclick','target_selected');
        },

        onEntering_client_want_catastrophe_target: function(args){
            if(!this.isCurrentPlayerActive())
                return
            var overpopulated = this.get_overpopulated_pieces();
            overpopulated.addClass('selectable overpopulated');
            this.connectClass('selectable','onclick','catastrophe_target_selected');
        },

        power_targets: function(empowerednode,power){
            var system = empowerednode.parentNode;
            // Nodes to highlight
            var candidates;
            switch(power){
                case '1':
                    return dojo.query('.hostile.ship',system);
                case '2':
                    return this.connected_systems(system).concat(this.connected_stacks(system));
                case '3':
                    // Build target is selected automatically, so don't highlight anything
                    return dojo.NodeList();
                case '4':
                    // TODO return candidates rather than highlighting manually
                    var ptype = empowerednode.getAttribute('ptype').split('_');
                    var old_color = ptype[0];
                    var pips = ptype[1];
                    var stack;
                    var children;
                    for(var i=1;i<=4;i++){
                        if(i==old_color)
                            continue;
                        stack = document.getElementById('stack_'+i+'_'+pips);
                        children = dojo.query('.banked',stack);
                        if(children.length==0)
                            continue;
                        dojo.addClass(stack,'selectable');
                    }
                    return dojo.NodeList();
                default:
                    console.error('Bad power number: '+power);
            }
        },

        get_overpopulated_pieces: function(){
            var systems = dojo.query('.system');
            var colors = ['.red','.yellow','.green','.blue'];
            var targets = dojo.NodeList();

            var system,i,j,color,result;
            for(i=0;i<4;i++){
                color = colors[i];
                for(j=0;j<systems.length;j++){
                    system = systems[j];
                    result = dojo.query(color,system);
                    if(result.length>=4){
                        targets = targets.concat(result);
                    }
                }
            }
            return targets;
        },

        // onLeavingState:
        // This method is called each time we are leaving a game state.
        // You can use this method to perform user interface changes.
        onLeavingState: function( state_name ) {
            console.log( 'Leaving state: '+state_name );
            // Call appropriate method
            var methodName = "onLeaving_" + state_name;
            if (this[methodName] !== undefined)
                this[methodName]();
        },

        onLeaving_want_creation: function(){
        },
        onLeaving_client_create_ship: function(){
            if(!this.isCurrentPlayerActive())
                return
            var selectable = dojo.query('.selectable');
            selectable.removeClass('selectable');
            this.disconnectAll();
        },
        onLeaving_want_free: function(){
            if(!this.isCurrentPlayerActive())
                return
            this.deselect_all();
        },
        onLeaving_want_sacrifice_action: function(){
            if(!this.isCurrentPlayerActive())
                return
            this.deselect_all();
        },
        onLeaving_client_want_power: function(){
            if(!this.isCurrentPlayerActive())
                return
            this.deselect_all();
        },
        onLeaving_client_want_target: function(){
            if(!this.isCurrentPlayerActive())
                return
            this.deselect_all();
            this.unempower_all();
        },
        onLeaving_client_want_catastrophe_target: function(args){
            if(!this.isCurrentPlayerActive())
                return
            this.deselect_all();
            var selectable = dojo.query('.overpopulated');
            selectable.removeClass('overpopulated')
        },

        // onUpdateActionButtons:
        // in this method you can manage "action buttons" that are displayed in the
        // action status bar (ie: the HTML links in the status bar).

        // This function appears to be redundant. It gets called just before
        // onEnteringState with the same parameters.
        // BGA's intention seems to be that this is the
        // "It's time to update action buttons" function
        // with the idea that you'll have so many buttons that
        // this deserves its own function
        onUpdateActionButtons: function( state_name, args ) {
            console.log('Update buttons args ',args);
            // Only active players get buttons
            if(!this.isCurrentPlayerActive())
                return;
            // Only choice states get buttons
            if(!state_name.startsWith('want') && !state_name.startsWith('client'))
                return;
            switch(state_name){
                // Server choice states get pass and catastrophe buttons
                case 'want_free':
                case 'want_sacrifice_action':
                case 'want_catastrophe':
                    this.addActionButton(
                        'catastrophe_button',
                        _('Trigger catastrophe'),
                        'catastrophe_button_selected'
                    );
                    this.addActionButton(
                        'pass_button',
                        _('End turn'),
                        'pass_button_selected'
                    );
                    break;
                case 'client_want_power':
                    this.addActionButton(
                        'sacrifice_button',
                        _('Sacrifice ship'),
                        'sacrifice_button_selected'
                    );
                    // NO BREAK
                    // The client_want_power state gets both
                    // a sacrifice and cancel button
                case 'client_want_target':
                    this.addActionButton(
                        'cancel_button',
                        _('Cancel'),
                        function(evt){
                            this.cancel_action();
                        }
                    );
                    break;
            }
            
        },

        ///////////////////////////////////////////////////
        //// Utility methods

        get_system: function(piecenode){
            // Get the system node containing this piece
            var par = piecenode.parentNode;
            if(!par.id.startsWith('system')){
                this.showMessage(
                    _('Piece is not in a system.'),
                    'error'
                );
                return null;
            }
            return par
        },

        set_turn_checkpoint: function(args,state_name){
            // args needs to be deeply copied because
            // it appears to be overwritten on state change
            //this['latest_args'] = this.deepcopy(args);
            this['latest_args'] = {
                state_name: state_name,
                descriptionmyturn: args.descriptionmyturn,
                args: args.args
            };
        },

        deepcopy: function(x){
            // Not fast, but easy to write
            return JSON.parse(JSON.stringify(x));
        },

        put_in_bank: function(piecenode){
            dojo.removeClass(piecenode,'friendly hostile star ship overpopulated');
            piecenode.removeAttribute('empower');
            dojo.addClass(piecenode,'banked');
            var cnameSplit = piecenode.getAttribute('ptype').split('_');
            var color = cnameSplit[0];
            var pips  = cnameSplit[1];
            var stacknode = document.getElementById('stack_'+color+'_'+pips);
            dojo.place(piecenode,stacknode);
        },

        // Make a system at setup from JSON object (creating new pieces)
        setup_system: function(system){
            var systemnode = this.place_system(
                system.system_id,
                system.system_name,
                system.homeplayer_id
            );

            var ship_id,star_id;

            // player ID of the player whose ships should point south
            var friendly_id;
            if(this.isSpectator)
                friendly_id = this.player_2;
            else
                friendly_id = this.player_id;
            // Add ships
            for(ship_id in system.ships){
                ship = system.ships[ship_id];
                if(friendly_id == ship.owner_id)
                    this.setup_piece(ship,'friendly ship',systemnode);
                else
                    this.setup_piece(ship,'hostile ship',systemnode);
            }

            // Add stars
            for(star_id in system.stars){
                star = system.stars[star_id];
                this.setup_piece(star,'star',systemnode);
            }
        },

        setup_piece: function(piece,more_classes,container){
            var params = {
                piece_id     : piece.piece_id,
                colorname    : this.get_color_name(piece.color),
                pipsname     : this.get_size_name(piece.pips),
                colornum     : piece.color,
                pipsnum      : piece.pips,
                more_classes : more_classes
            };
            var piece_html = this.format_block('jstpl_piece',params);
            dojo.place( piece_html, container);
        },

        get_color_name: function(i){
            i = parseInt(i);
            switch(i){
                case 1:
                    return 'red';
                case 2:
                    return 'yellow';
                case 3:
                    return 'green';
                case 4:
                    return 'blue';
                default:
                    console.error('Bad color: '+i);
            }
        },

        get_size_name: function(i){
            i = parseInt(i);
            switch(i){
                case 1:
                    return 'small';
                case 2:
                    return 'medium';
                case 3:
                    return 'large';
                default:
                    console.error('Bad size: '+i);
            }
        },

        ajaxcallwrapper: function(action, args, handler) {
            // this allows to skip args parameter for action which do not require them
            if (!args)
                args = [];
            // Avoid rapid clicking problems
            args.lock = true;
            // Check that player is active and action is declared
            if (this.checkAction(action)) {
                // this is mandatory fluff
                this.ajaxcall(
                    "/" + this.game_name + "/" + this.game_name + "/" + action + ".html",
                    args,
                    this,
                    // Success result handler is empty - it is seldom needed
                    (result) => {},
                    // The real result handler is called both on success and error
                    // The optional param  "is_error" is seldom needed
                    handler
                );
            }
        },

        place_ship: function(piecenode,owner_id,systemnode){
            dojo.place(piecenode,systemnode);
            dojo.removeClass(piecenode,'banked');
            dojo.addClass(piecenode,'ship');
            if(owner_id==this.get_bot_player())
                dojo.addClass(piecenode,'friendly');
            else
                dojo.addClass(piecenode,'hostile');
        },
        place_star: function(piecenode,systemnode){
            dojo.place(piecenode,systemnode);
            dojo.removeClass(piecenode,'banked');
            dojo.addClass(piecenode,'star');
        },
        place_system: function(system_id,system_name,homeplayer_id=null){
            var params,par;
            if(homeplayer_id == null){
                params = {
                    system_id:system_id,
                    system_name:system_name,
                    homeplayer_id:'none'
                };
                // The parent of a colony is the board
                par = 'board';

            }
            else{
                params = {
                    system_id:system_id,
                    system_name:system_name,
                    homeplayer_id:'player_'+homeplayer_id
                };
                // The parent of a home system node is a special container
                if(homeplayer_id == this.get_bot_player())
                    par = 'home_container_bot';
                else
                    par = 'home_container_top';
            }

            var systemnode = dojo.place(
                this.format_block('jstpl_system',params),
                par
            );
            return systemnode;
        },

        connected_systems: function(systemnode){
            // Get an array of connected system nodes and bank stacks
            // TODO do this right
            var old_stars = dojo.query('.star',systemnode);
            var systems = dojo.query('.system');
            var i,j,k;
            var new_stars;
            var new_star,new_size;
            var old_size,old_size;
            var breakout;
            i = 0;
            while(i<systems.length){
                new_stars = dojo.query('.star',systems[i]);
                for(j=0;j<new_stars.length;j++){
                    breakout = 0;
                    new_star = new_stars[j];
                    new_size = new_star.getAttribute('ptype').split('_')[1];
                    for(k=0;k<old_stars.length;k++){
                        old_star = old_stars[k];
                        old_size = old_star.getAttribute('ptype').split('_')[1];
                        if(new_size==old_size){
                            // Not connected
                            systems.splice(i,1);
                            breakout = 1;
                            break;
                        }
                    }
                    if(breakout)
                        break;
                }
                // If array was shortened, don't increment index
                if(!breakout)
                    i++;
            }
            return systems;
        },

        connected_stacks: function(systemnode){
            var stars = dojo.query('.star',systemnode);
            var stacks = dojo.query('.stack');
            var i,j;
            var new_size,old_size,star;
            var stack;
            i = 0;
            while(i<stacks.length){
                breakout = 0;
                stack = stacks[i];
                // Skip empty stacks
                if(dojo.query('.banked',stack).length==0){
                    stacks.splice(i,1);
                    continue
                }
                new_size = stack.id.split('_')[2];
                for(j=0;j<stars.length;j++){
                    star = stars[j];
                    old_size = star.getAttribute('ptype').split('_')[1];
                    if(new_size==old_size){
                        // Not connected
                        stacks.splice(i,1);
                        breakout = 1;
                        break;
                    }
                }
                // If array was shortened, don't increment index
                if(!breakout)
                    i++;
            }
            return stacks;
        },

        get_bot_player: function(){
            if(this.isSpectator)
                return this.player_2;
            return this.player_id;
        },

        deselect_all: function(){
            var selectable = dojo.query('.selectable');
            selectable.removeClass('selectable')
            this.disconnectAll();
        },

        unempower_all: function(){
            var empowered = dojo.query('[empower]');
            empowered.removeAttr('empower');
        },

        ///////////////////////////////////////////////////
        //// Player's action
        stack_selected_creation: function(evt){
            evt.preventDefault();
            dojo.stopEvent(evt);

            var stacknode = evt.currentTarget;
            var children = stacknode.children;
            if(children.length == 0){
                this.showMessage(
                    _('No pieces of this type remain.'),
                    'error'
                );
                return;
            }
            var piecenode = children[children.length-1];

            var home_candidates = dojo.query('[homeplayer_id=player_'+this.player_id+']');
            var systemnode;
            if(home_candidates.length == 0){
                // Home hasn't been created yet, so we must create it now
                var player = this.gamedatas.players[this.player_id];
                var player_name = player.name;
                // Start out with an empty name and temporary id
                systemnode = this.place_system(
                    'tempid',
                    '',
                    this.player_id
                );
            }
            else
                systemnode = home_candidates[0];
            var starnodes = dojo.query('.star',systemnode);
            if(starnodes.length<=1){
                this.place_star(
                    piecenode,
                    systemnode
                );
                return;
            }
            // Make sure a ship didn't already get added
            var shipnodes = dojo.query('.ship',systemnode);
            if(shipnodes.length > 0){
                this.showMessage(
                    _('Cannot select more pieces for creation.'),
                    'error'
                );
                return
            }
            this.place_ship(
                piecenode,
                this.player_id,
                systemnode
            );
            this.ajaxcallwrapper(
                'act_creation',
                {
                    star1_id: starnodes[0].id.split('_')[1],
                    star2_id: starnodes[1].id.split('_')[1],
                    ship_id:  piecenode.id.split('_')[1]
                }
            );
        },

        cancel_action(){
            this.deselect_all();
            this.unempower_all();
            args = this['latest_args'];
            this.setClientState(args.state_name,args);
        },

        empower_ship: function(shipnode,color=null){
            // Free action
            console.log('empowering',shipnode);
            if(color == null){
                shipnode.setAttribute('empower','pending');
                this.setClientState(
                    'client_want_power',
                    {
                        descriptionmyturn :
                        '${you} must choose a star or friendly ship in the same system.'
                    }
                );
            }
            else{
                shipnode.setAttribute('empower',color);
                this.power_selected(color);
            }
        },

        power_selected: function(color){
            // The ship being empowered
            var empowerednode = dojo.query('[empower]')[0];
            empowerednode.setAttribute('empower',color);
            this.setClientState(
                'client_want_target',
                {
                    descriptionmyturn :
                    '${you} must choose a target.'
                }
            );
            if(color==3){
                // Build
                // The color is green, so no target needs to be chosen, and we're done here
                this.ajaxcallwrapper(
                    'act_power_action',
                    {
                        piece_id:empowerednode.id.split('_')[1],
                        power:3
                    }
                );
                return;
            }
        },

        catastrophe_target_selected: function(evt){
            evt.preventDefault();
            dojo.stopEvent(evt);
            var targetnode = evt.currentTarget;
            var target_color = targetnode.getAttribute('ptype').split('_')[0];
            var target_system = this.get_system(targetnode);
            this.ajaxcallwrapper(
                'act_catastrophe',
                {
                    system_id: target_system.id.split('_')[1],
                    color: target_color
                }
            );
        },

        target_selected: function(evt){
            evt.preventDefault();
            dojo.stopEvent(evt);
            var empowerednode = dojo.query('[empower]')[0];
            var targetnode = evt.currentTarget;
            var power = empowerednode.getAttribute('empower');
            var target_ids = targetnode.id.split('_');
            var empower_id = empowerednode.id.split('_')[1];
            switch(power){
            case '1':
                // Capture
                this.ajaxcallwrapper(
                    'act_power_action',
                    {
                        piece_id:  empower_id,
                        power:     1,
                        capture_id: target_ids[1]
                    }
                );
                break;
            case '2':
                // Move or discover
                var is_discovery = targetnode.classList.contains('stack');
                if(is_discovery){
                    this.ajaxcallwrapper(
                        'act_power_action',
                        {
                            piece_id:       empower_id,
                            power:          2,
                            is_discovery:   1,
                            star_color_num: target_ids[1],
                            star_pips:      target_ids[2],
                        }
                    );
                }
                else{
                    this.ajaxcallwrapper(
                        'act_power_action',
                        {
                            piece_id:     empower_id,
                            power:        2,
                            is_discovery: 0,
                            system_id:    target_ids[1],
                        }
                    );
                }
                break
            // case '3' (green) should have been handled without a target
            case '4':
                // Trade
                this.ajaxcallwrapper(
                    'act_power_action',
                    {
                        piece_id:     empower_id,
                        power:        4,
                        color_num: target_ids[1]
                    }
                );
                break;
            default:
                console.error('Bad power number: '+power);
            }
        },

        sacrifice_button_selected: function(){
            var shipnode = dojo.query('[empower]')[0];
            shipnode.setAttribute('empower','sacrifice');
            this.ajaxcallwrapper(
                'act_sacrifice',
                {
                    ship_id: shipnode.id.split('_')[1]
                }
            );
        },

        catastrophe_button_selected: function(){
            this.setClientState(
                'client_want_catastrophe_target',
                {descriptionmyturn:_('${you} may trigger a catastrophe.')}
            );
        },

        pass_button_selected: function(){
            this.ajaxcallwrapper('act_pass',{});
        },

        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        /*
        setupNotifications:

        In this method, you associate each of your game notifications
        with your local method to handle it.

        Note: game notification names correspond to
        "notifyAllPlayers" and "notifyPlayer" calls in
        your binaryhomeworlds.game.php file.
        */
        setupNotifications: function() {
            dojo.subscribe('notif_debug'   ,this,'ignore_notif');

            dojo.subscribe('notif_create'  ,this,'create_from_notif');

            dojo.subscribe('notif_capture' ,this,'capture_from_notif');
            dojo.subscribe('notif_build'   ,this,'build_from_notif');
            dojo.subscribe('notif_trade'   ,this,'trade_from_notif');

            dojo.subscribe('notif_discover',this,'discover_from_notif');
            dojo.subscribe('notif_move',    this,'move_from_notif');
            dojo.subscribe('notif_fade',    this,'fade_from_notif');

            dojo.subscribe('notif_sacrifice',   this,'sacrifice_from_notif');
            dojo.subscribe('notif_catastrophe', this,'catastrophe_from_notif');

            dojo.subscribe('notif_pass', this,'ignore_notif');
        },

        ignore_notif: function(notif){
        },

        create_from_notif: function(notif){
            console.log('Creating homeworld');
            var args = notif.args;
            var systemnode_candidates = dojo.query(
                '[homeplayer_id=player_'+args.homeplayer_id+']'
            );
            var systemnode;
            if(systemnode_candidates.length != 0){
                // The system is already represented by a node,
                // so this is the player who made it.
                // The pieces were moved in real time on client side,
                // so all that needs to happen is that the
                // system_id and system_name should be
                // made to match the server assignment
                systemnode = systemnode_candidates[0];
                systemnode.id = 'system_'+args.system_id;
                var labelnode = dojo.query('.system_label',systemnode);
                labelnode.innerHTML = args.system_name;
                return;
            }

            var systemnode = this.place_system(
                args.system_id,
                args.system_name,
                args.homeplayer_id
            );
            var piecenode;
            piecenode = document.getElementById('piece_'+args.star1_id);
            this.place_star(
                piecenode,
                systemnode
            );
            piecenode = document.getElementById('piece_'+args.star2_id);
            this.place_star(
                piecenode,
                systemnode
            );
            piecenode = document.getElementById('piece_'+args.ship_id);
            this.place_ship(
                piecenode,
                args.homeplayer_id,
                systemnode
            );
        },

        capture_from_notif: function(notif){
            console.log('Capturing');
            var args = notif.args;
            var shipnode = document.getElementById('piece_'+args.target_id);
            if(this.isCurrentPlayerActive()){
                dojo.removeClass(shipnode,'hostile');
                dojo.addClass(shipnode,'friendly');
            }
            else{
                dojo.removeClass(shipnode,'friendly');
                dojo.addClass(shipnode,'hostile');
            }
        },

        fade_from_notif: function(notif){
            console.log('Fading');
            var args = notif.args;
            var systemnode   = document.getElementById('system_'+args.system_id);
            var piecenodes = dojo.query('.ship,.star',systemnode);
            var piecenode;
            for(var i=0;i<piecenodes.length;i++)
                this.put_in_bank(piecenodes[i]);
            systemnode.remove();
        },

        move_from_notif: function(notif){
            console.log('Moving');
            var args = notif.args;
            var shipnode   = document.getElementById('piece_'+args.ship_id);
            var systemnode = document.getElementById('system_'+args.system_id);
            dojo.place(shipnode,systemnode);
        },

        discover_from_notif: function(notif){
            console.log('Discovering');
            var args = notif.args;
            var starnode   = document.getElementById('piece_'+args.star_id);
            var systemnode = this.place_system(
                args.system_id,
                args.system_name
            );
            this.place_star(starnode,systemnode);
        },

        build_from_notif: function(notif){
            console.log('Building');
            var args = notif.args;
            var systemnode = document.getElementById('system_'+args.system_id);
            var shipnode   = document.getElementById('piece_'+args.ship_id);
            this.place_ship(
                shipnode,
                args.player_id,
                systemnode
            );
        },

        trade_from_notif: function(notif){
            console.log('Trading');
            var args = notif.args;
            var systemnode  = document.getElementById('system_'+args.system_id);
            var oldshipnode = document.getElementById('piece_'+args.old_ship_id);
            var newshipnode = document.getElementById('piece_'+args.new_ship_id);
            this.place_ship(
                newshipnode,
                args.player_id,
                systemnode
            );
            this.put_in_bank(oldshipnode);
        },

        sacrifice_from_notif: function(notif){
            console.log('Sacrificing');
            var args = notif.args;
            var shipnode  = document.getElementById('piece_'+args.ship_id);
            this.put_in_bank(shipnode);
        },
        catastrophe_from_notif: function(notif){
            console.log('Catastrophe-ing');
            var args = notif.args;
            var system = document.getElementById('system_'+args.system_id);
            var color_name = this.get_color_name(args.color);

            var pieces = dojo.query('.'+color_name,system);
            for(var i=0;i<pieces.length;i++)
                this.put_in_bank(pieces[i]);
        }
   });
});

