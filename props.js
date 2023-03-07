// props.js: Extension properties (accordeon menu) externalized

define(["qlik", "jquery"], function
    (qlik, $) {

    const ext = 'qs-ext-kpi-trellis';

    return {

        settings: function () {
            return [
                {
                    type: "number",
                    component: "slider",
                    label: function (arg) { return 'Minimum width of tile ' + arg.pWidth + 'px' },
                    ref: "pWidth",
                    min: 75,
                    max: 300,
                    step: 25,
                    defaultValue: 150
                }, {
                    type: "number",
                    component: "slider",
                    label: function (arg) { return 'Height of tile ' + arg.pHeight + 'px' },
                    ref: "pHeight",
                    min: 50,
                    max: 300,
                    step: 25,
                    defaultValue: 100
                }, {
                    label: "What to render",
                    type: "string",
                    component: "dropdown",
                    ref: "pVisType",
                    defaultValue: "kpi",
                    options: [{
                        value: "kpi",
                        label: "Simple KPI"
                    }, {
                        value: "advanced-kpi2",
                        label: "Advanced KPI 2"
                    }]
                }, {
                    label: 'Master Element KPI',
                    type: 'string',
                    component: 'dropdown',
                    ref: 'pVisId',
                    // defaultValue: '',
                    // expression: 'optional',
                    show: function (arg) { return arg.pVisType != 'kpi' },
                    options: getMasterObjects()
                }, {
                    label: 'Master Element Details',
                    type: 'string',
                    component: 'dropdown',
                    ref: 'pDetailVisId',
                    // defaultValue: '',
                    // expression: 'optional',
                    show: function (arg) { return arg.pVisType != 'kpi' },
                    options: getMasterObjects()
                }, {
                    label: 'Background Color (css)',
                    type: 'string',
                    ref: 'pBgColor',
                    defaultValue: 'white',
                    expression: 'optional'
                }
                , subSection('Demo of properties', [
                    {
                        label: "Simple text display",
                        component: "text"
                    }, {
                        label: 'String input',
                        type: 'string',
                        ref: 'pDemoString',
                        defaultValue: 'lorem ipsum',
                        expression: 'optional'
                    }, {
                        label: "Checkbox",
                        type: "boolean",
                        defaultValue: true,
                        ref: "pDemoBoolean"
                    }, {
                        label: function (arg) { return 'Slider: ' + arg.pDemoSlider },
                        type: "number",
                        component: "slider",
                        ref: "pDemoSlider",
                        min: 0,
                        max: 10,
                        step: 2,
                        defaultValue: 4
                    }, {
                        label: "Dropdown",
                        type: "string",
                        component: "dropdown",
                        ref: "pDemoDrowdown",
                        options: [{
                            value: "one",
                            label: "Option 1",
                            tooltip: "Tooltip 1"
                        }, {
                            value: "two",
                            label: "Option 2",
                            tooltip: "Tooltip 2"
                        }]
                    }, {
                        label: "Button Group",
                        type: "string",
                        defaultValue: "one",
                        ref: "pDemoButtonGroup",
                        component: "buttongroup",
                        options: [{
                            value: "one",
                            label: "Option 1",
                            tooltip: "Tooltip 1"
                        }, {
                            value: "two",
                            label: "Option 2",
                            tooltip: "Tooltip 2"
                        }]
                    }

                ])
            ]
        },

        about: function (qext) {
            return [
                {
                    label: function (arg) { return 'Installed extension version ' + qext.version },
                    component: "link",
                    url: '../extensions/qs-ext-kpi-trellis/qs-ext-kpi-trellis.qext'
                }, {
                    label: "This extension is available either licensed or free of charge by data/\\bridge, Qlik OEM partner and specialist for Mashup integrations.",
                    component: "text"
                }, {
                    label: "Without license you may use it as is. Licensed customers get support.",
                    component: "text"
                }, {
                    label: "",
                    component: "text"
                }, {
                    label: "About Us",
                    component: "link",
                    url: 'https://www.databridge.ch'
                }, {
                    label: "More",
                    component: "button",
                    action: function (arg) {
                        console.log(arg);
                        window.open('https://github.com/ChristofSchwarz/qs-ext-kpi-trellis', '_blank');
                    }
                }
            ]
        }
    }

    function subSection(labelText, itemsArray, argKey, argVal) {
        var ret = {
            component: 'expandable-items',
            items: {}
        };
        var hash = 0;
        for (var j = 0; j < labelText.length; j++) {
            hash = ((hash << 5) - hash) + labelText.charCodeAt(j)
            hash |= 0;
        }
        ret.items[hash] = {
            label: labelText,
            type: 'items',
            show: function (arg) { return (argKey && argVal) ? (arg[argKey] == argVal) : true },
            items: itemsArray
        };
        return ret;
    }

    async function getMasterObjects(arg) {
        const app = qlik.currApp();
        const enigma = app.model.enigmaModel;
        const sessObj = await enigma.createSessionObject({
            qInfo: {
                qType: "masterobject",
            },
            qAppObjectListDef: {
                qType: "masterobject",
                qData: {
                    name: "/metadata/name",
                    visualization: "/visualization",
                    tags: "/metadata/tags"
                }
            }
        });
        const masterVisList = await sessObj.getLayout();
        var ret = [];
        for (const qItem of masterVisList.qAppObjectList.qItems) {
            ret.push({ value: qItem.qInfo.qId, label: qItem.qData.visualization + ': ' + qItem.qMeta.title })
        }

        ret.sort(function (a, b) {
            return ((a.label < b.label) ? -1 : ((a.label > b.label) ? 1 : 0));
        });
        //console.log('Master Visualizations found', ret);
        return ret;
    }
});
