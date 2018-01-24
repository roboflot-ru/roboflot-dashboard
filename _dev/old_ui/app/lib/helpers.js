/*
    Here are some useful functions use all over the app
 */

define({

    // Time formatted from unformatted
    time_string: function(h, m, s){
        return (h < 10 ? '0' + h : '' + h) + ':' + (m < 10 ? '0' + m : '' + m) + ( s !== undefined ? (':' + (s < 10 ? '0' + s : '' + s)) : '');
    }

    // Seconds to string of readable uptime
    ,readable_seconds: function(seconds){
        if( !seconds ) seconds = 0;

        if( seconds > 3600*200 ){ // 200 hours
            return 'too long';
        }

        if( seconds < 60 ){
            return '1min';
        }

        if( seconds < 3600 ){
            return Math.round(seconds/60) + 'min';
        }

        if( seconds >= 3600 ){
            return Math.round(seconds/3600) + 'h ' + Math.round((seconds%3600)/60) + 'min';
        }

    }

});