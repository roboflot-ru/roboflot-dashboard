define({

    // Время в правильном формате
    time_string: function(h, m, s){
        return (h < 10 ? '0' + h : '' + h) + ':' + (m < 10 ? '0' + m : '' + m) + ( s !== undefined ? (':' + (s < 10 ? '0' + s : '' + s)) : '');
    }

    // Секунды переведенные в часы и минуты
    ,readable_seconds: function(seconds){
        if( !seconds ) seconds = 0;

        if( seconds > 3600*200 ){ // 200 часов
            return 'очень давно';
        }

        if( seconds < 60 ){
            return '1мин';
        }

        if( seconds < 3600 ){
            return Math.round(seconds/60) + 'мин';
        }

        if( seconds >= 3600 ){
            return Math.round(seconds/3600) + 'ч ' + Math.round((seconds%3600)/60) + 'мин';
        }

    }

});