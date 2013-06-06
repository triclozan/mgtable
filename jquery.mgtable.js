/* 
 * Mgtable jquery plugin.
 * Copyright by Irina Molodyh, 2013.
 */


(function($) {

    /* Функция возвращает нужный список. при необходимости загружает его
     * 
     * @param {type} k
     * @param {type} options
     * @returns {unresolved}
     */
    function getList(name, options)
    {
        listStore = $.data(document.body, 'listStore');
        if (listStore == null) {
            $.data(document.body, 'listStore', Array());
            listStore = $.data(document.body, 'listStore');
        }
        if (listStore[name] != null) {
            return listStore[name];
        }
        else {
            if (isOnline()) {
                //console.log('online');
                list = loadData(options);
                listStore[name] = list;
                $.data(document.body, 'listStore', listStore);
                persistData(null, 'list$' + name, list);
            }
            else {
                //console.log('offline');
                list = restoreData(null, 'list$' + name);
            }           
            return list;
        }
    }

    /* Функция добавляет список в блок
     * 
     * @param {type} type
     * @param {type} block
     * @param {type} list
     * @param {type} val
     * @returns {undefined}
     */
    function outList(type, block, list, val)
    {
        if (type === 'select')
        {
            $(block).append(tplRender('select', {name: 'code'}));
            l = $(block).find('select');
            $.each(list, function(k, v) {
                s = '';
                if (v.id == val)
                {
                    s = 'selected';
                }
                $(l).append(tplRender('option', {id: v.id, value: v.value, selected: s}));
            });
        } else if (type === 'autocomplete') {
            //list = list.SimpleEntity;
            b = $(block).find('input:eq(0)');

            $(b).keyup(function() {
                //Создаем блок для вывода списка
                if (!$('.list_block').length)
                {
                    $('body').append(tplRender('ul', {'class': 'list_block'}));
                }
                listBlock = $('.list_block');
                
                //формируем список
                listContent = '';
                input = $(this);
                inputValue = input.val();
                if (inputValue.length > 2)
                {
                    $.each(list, function(k, v)
                    {
                        if (v.value.toLowerCase().indexOf(inputValue.toLowerCase()) === 0)
                        {
                            listContent += tplRender('li', {id: v.id, value: v.value});
                        }
                    });
                }
                //выводим список в блок под вызвавшем элементом
                if (listContent.length)
                {
                    listBlock.html(listContent).css({position: 'absolute', left: $(this).offset().left, top: $(this).offset().top + $(this).height()}).slideDown('normal');
                } else {
                    listBlock.slideUp('normal');
                }
                
                //обработка клика по элементу списка
                listBlock.find('li').click(function() {
                    input.val($(this).text());
//                    input.change();
                });
            });

            $(b).blur(function() {
                listBlock = $('.list_block');
                listBlock.slideUp('normal');
            });
        }
    }

    /* Функция для сохранения данных в блоке
     * возможно, от неё придется избавиться, но пока пусть будет...
     * @param {type} block
     * @param {type} data
     * @param {type} k
     * @returns {undefined}
     */
    function bindData(block, data, k)
    {
        $(block).data(k, data);
    }

    /* Функция для проверки url
     * её нужно дописать, ато плохо все!
     * @param {type} str
     * @returns {Boolean}
     */
    function isUrl(str)
    {
        var res = true;
        outMessage('нужно написать проверку ' + str);
        return res;
    }

    /* Функция, для формирования html-тега по заданному шаблону
     * 
     * @param {type} key - ключ шаблона
     * @param {type} val - массив параметров для подстановки в шаблон
     * @returns {unresolved}
     */
    function tplRender(key, val)
    {
        var strRender = templates[key];
        $.each(val, function(k, v) {
            strRender = strRender.split('{' + k + '}').join(v);
        });
        return strRender;
    }

    /* Функция для вывода оповещений и служебной информации.
     * Будет дописываться по мере необходимости.
     * @param {type} message текст сообщения
     * @param {type} type тип сообщения
     * @returns {undefined}
     */
    function outMessage(message, type)
    {
        switch (type)
        {
            case 'log':
                {
                    //console.log('mgTable:');
                    //console.log(message);
                    break;
                }
            default:
                {
                    //console.log('mgTable default:');
                    //console.log(message);
                    break;
                }
        }
    }

    /* Функция, создающая таблицу и выводящая заголовок. 
     * Вызывается при инициализации или изменении зпголовка табдицы.
     * @param {type} block - имя блока в который вставляется таблица
     * @param {type} options - параметры вывода таблицы
     * @returns {undefined}
     */
    function outHeader(block, options)
    {
        $(block).html(tplRender('table', {}));
        var tr = $(block).find('#mgtable tr:eq(0)');
        options = $(block).data('options');
        $.each(options.columns, function(k, v) {
            tr.append(tplRender('th', {value: v.name, id: k})); //-плохо с таким ИД
        });
        if (options.del) {
            tr.append('<th class="delete_column">Удалить</th>');
        }
    }

    /* Функция вывода панели управления
     * 
     * @param {type} block
     * @returns {undefined}
     */
    function outPanel(block) {
        $(block).find('#mgtable').parent().append('<div class="mgPanel"/>'); //-плохо с таким ИД
        panel = $(block).find('.mgPanel');
        
        panel.append(tplRender('button', {'value': "Вставить", 'class': "insert"}));
        panel.find('.insert').on('click', function() {
            var headers = $(block).find('#mgtable th'); 
            insertRow(block, null, headers, true);
        });

        panel.append(tplRender('button', {'value': "Обновить", 'class': "resfesh"}));
        panel.find('.resfesh').on('click', function() {
            $('#mgtable').empty();
            data = loadData($(block).data('options').serverApi.load);
            /*if (typeof(data[1]) != 'object')//придумать какую-нибудь проверку, ато мало ли...
            {
                data = JSON.parse('[' + JSON.stringify(data) + ']');
            }*/
            if (data.length == 0) {
                    data = Array();
            }

            outHeader($(block));
            outData($(block), data, $(block).data('options').columns, $(block).data('options').lists);
            
            persistData($(block).attr('id'), 'data', data);
            persistData($(block).attr('id'), 'state', data);
            outPanel($(block));
            str = {rows: []};
            str.rows = data;
            table = $(block).find('#mgtable');
            table.data('table', str);
        });        
        
        panel.append(tplRender('button', {'value': "Сохранить", 'class': "save"}));
        panel.find('.save').on('click', function() {
            res = $('#mgtable').mgtable('compare');
            res = JSON.stringify(res);
            var handlers = {};
            handlers.success = function(msg) {
                $('#mgtable').empty();
                data = loadData($(block).data('options').serverApi.load);
                /*if (typeof(data[1]) != 'object')//придумать какую-нибудь проверку, ато мало ли...
                {
                    data = JSON.parse('[' + JSON.stringify(data) + ']');
                }*/
                if (data.length == 0) {
                    data = null;
                }
                outHeader($(block));
                outData($(block), data, $(block).data('options').columns, $(block).data('options').lists);
                outPanel($(block));
                persistData($(block).attr('id'), 'data', data);
                persistData($(block).attr('id'), 'state', data);
                str = {rows: []};
                str.rows = data;
                table = $(block).find('#mgtable');
                table.data('table', str);
            }
            loadData($(block).data('options').serverApi.save, {'rows': res}, handlers);
        });
        
        panel.append(tplRender('button', {'value': "Отложить правку", 'class': "save_local"}));
        panel.find('.save_local').on('click', function() {
            data = getSnapshot(block);
            persistData($(block).attr('id'), 'state', data);
        });

    }

    /* Функция вставки строки
     * 
     * @param {type} block
     * @returns {undefined}
     */
    function insertRow(block, data, headers, isNew) {
        options = $(block).data('options');
        columns = options.columns;
        lists = options.lists;
        var table = $(block).find('#mgtable');
        var val = data;        
        $(table).append(tplRender('tr', {id: (isNew ? '' : 'tr_' + val.id)}));
        var tr = $(table).find('tr:last');
        $.each(headers, function(k, v) {//цикл по столбцам
            if ($(v).attr("class") == "delete_column") {
                return;
            }
            col_id = $(v).attr("id");
            $(tr).append(tplRender('td', {}));
            b = $(tr).find('td:last');
            tdVal = (isNew ? columns[col_id].def : val[col_id]);
            switch (columns[col_id].tag) {
                case 'input':
                    {
                        $(b).append(tplRender('input', {value: tdVal}));
                        if (columns[col_id].autocomplete_list)
                        {
                            outList('autocomplete', b, getList(columns[col_id].autocomplete_list, lists[columns[col_id].autocomplete_list].serverApi), tdVal);
                        }
                        break;
                    }
                case 'select':
                    {
                        if (lists[columns[col_id].select_list])
                        {
                            outList('select', b, getList(columns[col_id].select_list, lists[columns[col_id].select_list].serverApi), tdVal);
                        } else {
                            outMessage('нет информации о списке выбора!');
                        }
                        break;
                    }
                case 'label':
                    {
                        $(b).append(tplRender('label', {value: tdVal}));
                        break;
                    }
                default:
                    {
                        $(b).append(tplRender('label', {value: tdVal}));
                        break;
                    }
            }
        });
        if (options.del) {
            $(tr).append('<td><input type="checkbox" class="del_select"/></td>');
        }
    }    

    /* Функция сохранения данных в локальном хранилище
     * 
     * @param {type} block
     * @param {type} key
     * @param {type} data
     * @returns {undefined}
     */
    function persistData(block, key, data)
    {
        if (block == null) {
            localStorage.setItem(key, JSON.stringify(data));
        }
        else {
            localStorage.setItem(block + '$' + key, JSON.stringify(data));            
        }
    }
    
    /* Функция извлечения данных из локального хранилища
     * 
     * @param {type} block
     * @param {type} key
     * @returns {undefined}
     */
    function restoreData(block, key)
    {
        if (block == null) {
            res = localStorage.getItem(key);
            if (res === 'undefined' || typeof res === 'undefined') {
                return null;
            }
            return JSON.parse(res);
        }
        else {
            res = localStorage.getItem(block + '$' + key);
            if (res === 'undefined' || typeof res === 'undefined') {
                return null;
            }
            return JSON.parse(res);
        }
    }

    /* Функция вывода данных
     * 
     * @param {type} block
     * @param {type} data
     * @param {type} options
     * @returns {undefined}
     */
    function outData(block, data, columns, lists)
    {
        var headers = $(block).find('#mgtable th'); //-плохо с таким ИД
        var table = $(block).find('#mgtable'); //-плохо с таким ИД
        $.each(data, function(k, val) {
            insertRow(block, val, headers, false);
        });
    }

    /*Функция загрузки данных.
     * @param {type} data  data/function/url
     * @returns {unresolved} data
     */
    function loadData(data, params, handlers)
    {
        if (typeof(data.url) == 'string')
        {
            if (isUrl(data.url))//является ли строка url
            {//если является загружаем данные
//тогда ещё чуть-чуть и со списками все будет замечательно!
                data.data = jQuery.extend(data.data, params);
                $.ajax({
                    async: false,
                    type: data.type,
                    url: data.url,
                    data: data.data,
                    success: ((handlers != null && handlers.success != null) ? handlers.success : 
                        function(msg) {
                            //console.log(msg);
                            d = JSON.parse(msg);
                        })
                });
            }
        } /*else if (typeof(data.function) == 'function')
        {
            var d = data.function();
            outMessage(d);
        }*/
        return d;
    }

    var templates = {input: "<input type = 'text' value = '{value}'></input>",
        button: "<input type = 'button' class = '{class}' value = '{value}'/>",
        label: "<label>{value}</label>",
        select: "<select name = '{name}'></select>",
        option: "<option value = '{id}' {selected}>{value}</option>",
        ul: "<ul class = '{class}'></ul>",
        li: "<li id = '{id}'>{value}</li>",
        tr: "<tr id = '{id}'></tr>",
        td: "<td ></td>",
        th: "<th id='{id}'>{value}</th>",
        table: "<table id='mgtable'><tr></tr></table>"}; //-плохо с таким ИД

    var defaults = {data_block: null,
        style: 'mgtable.style.css', //поменять, чтобы искалось в текущей папке.
        serverApi: {
            load: {
                url: null,
                'function': null,
                object: null,
                type: 'POST',
                data: {
                }}},
        columns: {row1: {name: 'row1', tag: 'lable', def: 'value1'}},
    };
    
    function getSnapshot(block) {
        allOptions = $(block).data('options');
        var keys = {};
        table = $(block).find('#mgtable');
        //console.log(table);
        table.find('tr:eq(0)').each(function() {//вытаскиваем ключи
            jQuery(this).find('th').each(function(index, v) {
                id = $(this).attr("id");
                columns = allOptions.columns;
                $.each(columns, function(k, v) {
                    if (k == id) {
                        keys[index] = id;
                    }
                });
            });
        });
        var data = [];
        //console.log(keys);
        /*
        startIndex = $(this).data('table').rows.length;
        data = $(this).data('table');*/
        table.find('tr:gt(0)').each(function() {
                //console.log('tr');
                currentTr = $(this);
                new_row = {};
                $.each(keys, function(key, val) {
                    new_row[val] = currentTr.find('td:eq(' + key + ') > *').val();
                });
                if ($(this).attr('id') != null) {
                    new_row['id'] = $(this).attr('id').replace(/[a-z]*_/, '');
                }
                data.push(new_row);
        });
        //console.log(data);    
        return data;        
    }    
    
    function isOnline() {
        return navigator.onLine;
    }
    
    var methods = {
        /*
         *  функция init()
         */
        init: function(options) {
            var dataBlock, myOptions, data;
            //outMessage('log', $(this).attr('id'));

            myOptions = jQuery.extend({}, defaults, options); //собираем все опции вместе (тут будет проверяться локальное хранилище)
            $(this).data('options', myOptions);
            //Подключение стилей
            if (document.createStyleSheet){
                document.createStyleSheet(myOptions.style);
            }
            else {
                $("head").append($("<link rel='stylesheet' href='" + myOptions.style + "' type='text/css' media='screen' />"));
            }
            
            //Вывод таблицы
            //1 - вывод заголовка таблицы
           
            outHeader($(this), myOptions.columns);
            //2 - вывод строк таблицы
            //2.1 - получение данных
            //console.log(navigator);
            if (isOnline()) {
                //console.log('online');
                state = restoreData($(this).attr('id'), 'state');
                localStorage.clear();
                data = loadData(myOptions.serverApi.load);
                if (data.length == 0) {
                    data = null;
                }
                if (state == null || state.length == 0) {
                    state = data;
                }
                //console.log(state);
                persistData($(this).attr('id'), 'data', data);
                persistData($(this).attr('id'), 'state', state);
            }
            else {
                //console.log('offline');
                data = restoreData($(this).attr('id'), 'data');
                state = restoreData($(this).attr('id'), 'state');
            }
            
            /*if (typeof(data[1]) != 'object')//придумать какую-нибудь проверку, ато мало ли...
            {
                data = JSON.parse('[' + JSON.stringify(data) + ']');
            }*/
            if (state == null || state.length == 0) {
                state = Array();
            }
//outMessage(data, 'log');
//2.2 - вывод данных в таблицу
            outData($(this), state, myOptions.columns, myOptions.lists);
            
            outPanel($(this));
                   
            var str = {rows: []};
            var numbers = Array();
            //console.log('Data:');
            //console.log(data);
            str.rows = (data == null ? Array() : data);
            table = $(this).find('#mgtable');
            table.data('table', str);
            $.each(options.columns, function(k, v) {
                numbers[k] = v;
            });
            table.data('save_col', options.columns);
                        
            /*jQuery(this).each(function() {
                jQuery(this).find('tr:eq(0)').each(function() {//вытаскиваем ключи
                    for (i = 0; i < $(options.numbers).length; i++) {
                        key = $(this).find('th:eq(' + options.numbers[i] + ')').attr("id");
                        keys.k[options.numbers[i]] = key;
                    }
                });
                jQuery(this).find('tr:gt(0)').each(function() {//сохраняем таблицу
                    row = {
                        "id": jQuery(this).attr('id').replace(/[a-z]*_/, '')
                    }
                    for (i = 0; i < $(options.numbers).length; i++) {
                        row[keys.k[i]] = jQuery(this).find('td:eq(' + options.numbers[i] + ') > *').val();
                    }   
                    str.rows.push(row);
                })
             //str.rows = data;
             table = $(this).find('#mgtable');
                if (!table.data('table')) {
                    table.data('table', str);
                    table.data('save_col', options.numbers);
                }
             });*/
             
             return this;
        },

        /*
         *  Функция get() возвращает результат сравнения JSON объкта, прикрепленного к таблице и состояния таблицы на момент вызова функци
         *  1 Параметр options
         *  2 options.numbers[] - номера столбцов которые нужно проверить наналичае изменения, или просто сохранить (необязательный, если не задан - используется значение, сохраненное фнкцией init())
         *  3 options.del - номер столбца который указывает на необходимость удалить строку (необязательный)
         */
        compare: function(options) {
            var options = jQuery.extend({}, options);
            var me = $(this);
            allOptions = me.parent().data('options');
            var keys = {};
            var delete_column;
            jQuery(this).find('tr:eq(0)').each(function() {//вытаскиваем ключи
                jQuery(this).find('th').each(function(index, v) {
                    if ($(v).attr('class') == 'delete_column') {
                        delete_column = index;
                    }
                    id = $(this).attr("id");
                    columns = allOptions.columns;
                    $.each(columns, function(k, v) {
                        if (k == id) {
                            keys[index] = id;
                        }
                    });                    
                });
            });
            var str = {};
            //console.log($(this).data('table'));
            startIndex = $(this).data('table').rows.length;
            data = $(this).data('table');
            $(this).find('tr:gt(' + startIndex + ')').each(function() {
                if (!allOptions.del || !$(this).find('td:eq(' + delete_column + ') input').prop("checked")) {
                    new_row = {};
                    if (!str.insert)
                        str.insert = {"row": []};
                    
                    currentTr = $(this);
                    $.each(keys, function(key, val) {
                        new_row[val] = currentTr.find('td:eq(' + key + ') > *').val();
                    });
                    str.insert.row.push(new_row);
                }
            });
            $(this).find('tr:gt(0):lt(' + startIndex + ')').each(function(k) {
                if (!allOptions.del || !$(this).find('td:eq(' + delete_column + ') input').prop("checked")) {
                    currentTr = $(this);
                    res = data.rows[k];
                    eq = true;
                    //проверка на наличае изменений
                    $.each(keys, function(key, val) {
                        eq = eq && (res[val] == currentTr.find('td:eq(' + key + ') > *').val())
                    });
                    if (!eq) {

                        if (!str.update)
                            str.update = {"row": []}; //если массива update нет, создаем его
                        row = {
                            "id": $(this).attr('id').replace(/[a-z]*_/, '')
                        };
                        $.each(keys, function(key, val) {
                            row[val] = currentTr.find('td:eq(' + key + ') > *').val();
                        });
                        str.update.row.push(row);
                    }

                } else {
                    
                    if (!str['delete'])
                        str['delete'] = {"id": []};
                    str['delete'].id.push($(this).attr('id').replace(/[a-z]*_/, ''));
                }
                return (k != startIndex);
            });
            //console.log(str);
            return str;
        }
    }

    jQuery.fn.mgtable = function(method)
    {
        if (methods[method]) {
            return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Метод ' + method + ' не существует в jQuery.mgtable');
        }
    }

})(jQuery);