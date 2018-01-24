export default {
    id: 'robot_settings_view'
    ,rows: [

        // Верхняя панель с кнопками
        {
            view: 'toolbar'
            ,elements: [
                {view:'icon', id: 'robots_dashboard_return', icon: 'tachometer', css: 'action_icon', tooltip: 'Панель управления'}
                ,{gravity: 4}
                ,{view:'icon', id: 'robot_share', icon: 'share-alt', tooltip: 'Добавить пользователей', hidden: true}
            ]
        }

        // Форма редактирования
        ,{
            view: 'form'
            ,id: 'robot_form'
            ,elements: [
                {view: 'text', name: 'name', label: 'Название', invalidMessage: "только буквы и цифры длиной не менее 3 символов"}
                ,{view: 'colorpicker', name: 'color', label: 'Цвет'}
                ,{view: 'text', name: 'id', label: 'ID', readonly: true, css: 'text_muted'}
                ,{
                    cols: [
                        {view: 'button', id: 'robot_save', value: 'Сохранить', width: 130, css: 'button_primary'}
                        ,{gravity:4}
                        ,{view: 'button', id: 'robot_remove', value: 'Удалить', width: 100, css: 'button_warning'}
                    ]
                }
            ]
            ,rules: {
                name: function(value){
                    return /^[a-zа-яё]+[a-zа-яё0-9 -]+[a-zа-яё0-9]+$/i.test(value);
                }
            }
        }


    ]
};