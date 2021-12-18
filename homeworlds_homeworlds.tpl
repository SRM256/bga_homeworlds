{OVERALL_GAME_HEADER}

<!--
- - BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com>
- -               & Emmanuel Colin <ecolin@boardgamearena.com>
- - Homeworlds implementation : © <Jonathan Baker> <babamots@gmail.com>
- -
- - This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
- - See http://en.boardgamearena.com/#!doc/Studio for more information.
-->

<div id='HWbank'>
    <!-- BEGIN stack -->
    <div id='HWstack_{COLOR}_{PIPS}' class='HWstack' style='left:{LEFT}%;top:{TOP}%'> </div>
    <!-- END stack -->
</div>

<!-- Putting the board after the bank makes it fill the remaining space-->
<div id='HWboard'>
    <div class='HWcenterizer'>
        <div id='HWhome_container_top' class='HWsystem_container'></div>
    </div>
    <div class='HWcenterizer'>
        <div id='HWcolony_container_1' class='HWsystem_container'></div>
    </div>
    <div class='HWcenterizer'>
        <div id='HWcolony_container_2' class='HWsystem_container'></div>
    </div>
    <div class='HWcenterizer'>
        <div id='HWcolony_container_3' class='HWsystem_container'></div>
    </div>
    <div class='HWcenterizer'>
        <div id='HWhome_container_bot' class='HWsystem_container'></div>
    </div>
</div>

<script type="text/javascript">
    var jstpl_system = "<div class='HWsystem' id='HWsystem_${system_id}' homeplayer_id='${homeplayer_id}'><div class='HWstar_container'><div class='HWsystem_label'>${system_name}</div></div></div>"
    var jstpl_piece = "<div class='HW${colorname} HW${pipsname} ${more_classes}' id='HWpiece_${piece_id}' ptype='${colornum}_${pipsnum}'><div class='HWcolor_symbol'>${color_symbol}</div></div>"
</script>

{OVERALL_GAME_FOOTER}

