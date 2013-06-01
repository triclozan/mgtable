/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


(function($) {

    /* Функция возвращает нужный список. при необходимости загружает его
     * 
     * @param {type} k
     * @param {type} options
     * @returns {unresolved}
     */
    function getList(options)
    {
        var list = loadData(options);
        return list;
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
            list = JSON.parse(list).SimpleEntity;
            //list = list.SimpleEntity;
            b = $(block).find('input:eq(0)');

            $(b).keyup(function() {
                //Создаем блок для вывода списка
                if (!$('.list_block').length)
                {
                    $('body').append(tplRender('ul', {class: 'list_block'}));
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
                    listBlock.html(listContent).css({left: $(this).offset().left, top: $(this).offset().top + $(this).height()}).slideDown('normal');
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
                    console.log('mgTable:');
                    console.log(message);
                    break;
                }
            default:
                {
                    console.log('mgTable default:');
                    console.log(message);
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
        $.each(options, function(k, v) {
            $(block).find('#mgtable tr:eq(0)').append(tplRender('th', {value: v.name, id: k})); //-плохо с таким ИД
        });
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
        $.each(data, function(k, val) {//цикл по строкам
            $(table).append(tplRender('tr', {id: val.id}));
            var tr = $(table).find('tr:last');
            $.each(headers, function(k, v) {//цикл по столбцам
                col_id = $(v).attr("id");
                $(tr).append(tplRender('td', {}));
                b = $(tr).find('td:last');
                switch (columns[col_id].tag) {
                    case 'input':
                        {
                            $(b).append(tplRender('input', {value: val[col_id]}));
                            if (columns[col_id].autocomplete_list)
                            {
                                outList('autocomplete', b, getList(lists[columns[col_id].autocomplete_list].serverApi), val[col_id]);
                            }
                            break;
                        }
                    case 'select':
                        {
                            if (lists[columns[col_id].select_list])
                            {
//outMessage(getList($(v).attr("id"), options[$(v).attr("id")].select_list));
                                outList('select', b, getList(lists[columns[col_id].select_list].serverApi), val[col_id]);
                            } else {
                                outMessage('нет информации о списке выбора!');
                            }
                            break;
                        }
                    case 'label':
                        {
                            $(b).append(tplRender('label', {value: val[col_id]}));
                            break;
                        }
                    default:
                        {
                            $(b).append(tplRender('label', {value: val[col_id]}));
                            break;
                        }
                }
            });
            bindData(tr, val, 'tr_data'); //тут будем временно записывать данные на страницу
        });
    }

    /*Функция загрузки данных.
     * @param {type} data  data/function/url
     * @returns {unresolved} data
     */
    function loadData(data)
    {
        if (typeof(data.url) == 'string')
        {
            if (isUrl(data.url))//является ли строка url
            {//если является загружаем данные
//тогда ещё чуть-чуть и со списками все будет замечательно!
                $.ajax({
                    async: false,
                    type: data.type,
                    url: data.url,
                    data: data.data,
                    success: function(msg) {
                        d = JSON.parse(msg);
                    }
                });
            }
        } else if (typeof(data.function) == 'function')
        {
            var d = data.function();
            outMessage(d);
        }
        return d;
    }

    var templates = {input: "<input type = 'text' value = '{value}'></input>",
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
                function: null,
                object: null,
                type: 'POST',
                data: {
                    render: 'partial',
                    act: 7,
                    type: $('select#type').val(),
                }}},
        columns: {row1: {name: 'row1', tag: 'lable', def: 'value1'}},
    };
    var methods = {
        /*
         *  функция init()
         */
        init: function(options) {
            var dataBlock, myOptions, data;
            //outMessage('log', $(this).attr('id'));

            myOptions = jQuery.extend({}, defaults, options); //собираем все опции вместе (тут будет проверяться локальное хранилище)

            //Подключение стилей
            $("head").append($("<link rel='stylesheet' href='" + myOptions.style + "' type='text/css' media='screen' />"));
            //Вывод таблицы
            //1 - вывод заголовка таблицы
            outHeader($(this), myOptions.columns);
            //2 - вывод строк таблицы
            //2.1 - получение данных
            data = loadData(myOptions.serverApi.load);
            if (typeof(data[1]) != 'object')//придумать какую-нибудь проверку, ато мало ли...
            {
                data = JSON.parse('[' + JSON.stringify(data) + ']');
            }
//outMessage(data, 'log');
//2.2 - вывод данных в таблицу
            outData($(this), data, myOptions.columns, myOptions.lists);
            outMessage($(this).data());
            /*var str = {rows: []};
             var keys = {k: []};
             
             jQuery(this).each(function() {
             jQuery(this).find('tr:eq(0)').each(function() {//вытаскиваем ключи
             for (i = 0; i < $(options.numbers).length; i++) {
             key = $(this).find('th:eq(' + options.numbers[i] + ')').attr("id");
             keys.k[options.numbers[i]] = key;
             }
             });
             jQuery(this).find('tr:gt(0)').each(function() {//сохраняем таблицу
             row = {
             "id": jQuery(this).attr('name').replace(/[a-z]*_/, '')
             }
             for (i = 0; i < $(options.numbers).length; i++) {
             row[keys.k[i]] = jQuery(this).find('td:eq(' + options.numbers[i] + ') > *').val();
             }
             str.rows.push(row);
             })
             //console.log( str );
             if (!$(this).data('table')) {
             $(this).data('table', str);
             $(this).data('save_col', options.numbers);
             }
             //console.log(this);
             console.log($(this).data());
             //console.log(' .data() test');
             });
             return this;*/
        },
        /*
         * функция выводит объект JSON в виде таблицы в заданный блок
         * 1. options.rows - массив строк таблицы { rows: [ {}, {}, ...] }
         * 2. ortions.headers[] - заголовок таблицы
         */
        outtable: function(options) {
//установк опций
            /*var options = jQuery.extend({}, defaults, options);
             var rows;
             if (typeof(options.rows) == 'function')
             rows = options.rows();
             console.log(rows);
             
             $(this).html('<table align="center" border="1" frame="border" rules="all" width="99%" id="jtable"><tr></tr></table>');
             
             //если тблица доступна для изменений
             if (options.check_table) {
             
             //вывод заголовка таблицы
             for (i = 0; i < (options.headers).length; i++) {
             if (options.headers[i] != "id") {
             $(this).find('#jtable tr:eq(0)').append('<th>' + options.headers[i] + '</th>');
             }
             }
             if (options.del) {
             $(this).find('#jtable tr:eq(0)').append('<th>Отметить для удаления</th>');
             }
             
             //вывод строк таблицы
             for (i = 0; i < (rows).length; i++) {
             //заполнение id строки
             $(this).find("#jtable").append('<tr id="tr_' + rows[i].id + '"></tr>');
             n = i + 1;
             $.each(rows[i], function(k, val) {
             if (k != "id") {
             $("#jtable tr:eq(" + n + ")").append('<td><input value = "' + val + '"/></td>')
             }
             });
             if (options.del) {
             $("#jtable tr:eq(" + n + ")").append('<td><input type="checkbox" class="del_select"/></td>')
             }
             }
             
             } else {//не доступна для изменений
             
             //вывод заголовка таблицы
             for (i = 0; i < (options.headers).length; i++) {
             if (options.headers[i] != "id") {
             $(this).find('#jtable tr:eq(0)').append('<th>' + options.headers[i] + '</th>');
             }
             }
             
             //вывод строк таблицы
             for (i = 0; i < (rows).length; i++) {
             //заполнение id строки
             $(this).find("#jtable").append('<tr id="tr_' + rows[i].id + '"></tr>');
             n = i + 1;
             $.each(rows[i], function(k, val) {
             if (k != "id") {
             $("#jtable tr:eq(" + n + ")").append('<td><p>' + val + '</p></td>')
             }
             });
             }
             }*/
        },
        /*
         *  Функция get() возвращает результат сравнения JSON объкта, прикрепленного к таблице и состояния таблицы на момент вызова функци
         *  1 Параметр options
         *  2 options.numbers[] - номера столбцов которые нужно проверить наналичае изменения, или просто сохранить (необязательный, если не задан - используется значение, сохраненное фнкцией init())
         *  3 options.del - номер столбца который указывает на необходимость удалить строку (необязательный)
         */
        compare: function(options) {

            var options = jQuery.extend({}, options);
            if (!options.numbers) {
                options.numbers = $(this).data('save_col');
            }
            var keys = {k: []};
            jQuery(this).find('tr:eq(0)').each(function() {//вытаскиваем ключи
                for (i = 0; i < $(options.numbers).length; i++) {
                    key = $(this).find('th:eq(' + options.numbers[i] + ')').attr("id");
                    keys.k[options.numbers[i]] = key;
                }
            });
            var str = {};
            startIndex = $(this).data('table').rows.length;
            //console.log('keys.k = ' + keys.k);
            data = $(this).data('table');
            console.log(JSON.stringify(data));
            $(this).find('tr:gt(' + startIndex + ')').each(function() {
                if (!options.del || !$(this).find('td:eq(' + options.del + ') input').prop("checked")) {
                    new_row = {};
                    if (!str.insert)
                        str.insert = {"row": []};
                    //console.log(str.insert);
                    for (i = 0; i < $(options.numbers).length; i++) {
                        new_row[keys.k[i]] = jQuery(this).find('td:eq(' + options.numbers[i] + ') > *').val();
                        //console.log(keys.k[i] + '  ' + row[keys.k[i]]);
                    }
                    str.insert.row.push(new_row);
                }
            });
            $(this).find('tr:gt(0):lt(' + startIndex + ')').each(function(k) {
                if (!options.del || !$(this).find('td:eq(' + options.del + ') input').prop("checked")) {

                    res = data.rows[k];
                    eq = true;
                    //проверка на наличае изменений
                    for (i = 0; i < $(options.numbers).length; i++) {
                        eq = eq && (res[keys.k[i]] == $(this).find('td:eq(' + options.numbers[i] + ') > *').val())
                    }
                    if (!eq) {

                        if (!str.update)
                            str.update = {"row": []}; //если массива update нет, создаем его
                        row = {
                            "id": $(this).attr('name').replace(/[a-z]*_/, '')
                        };
                        for (i = 0; i < $(options.numbers).length; i++) {
                            row[keys.k[i]] = jQuery(this).find('td:eq(' + options.numbers[i] + ') > *').val();
                        }
                        str.update.row.push(row);
                    }

                } else {
                    if (!str.delete)
                        str.delete = {"id": []};
                    str.delete.id.push($(this).attr('name').replace(/[a-z]*_/, ''));
                }
                return (k != startIndex);
            });
            console.log(str.update);
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