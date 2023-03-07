define(["qlik", "jquery", "./leonardo-msg", "text!./styles.css", "./props"], function
    (qlik, $, leonardo, cssContent, props) {

    'use strict';
    $("<style>").html(cssContent).appendTo("head");

    const maxCharts = 16;
    var kpiTrellisGlobal = {};

    $.ajax({
        url: '../extensions/qs-ext-kpi-trellis/qs-ext-kpi-trellis.qext',
        dataType: 'json',
        async: false,  // wait for this call to finish.
        success: function (data) { kpiTrellisGlobal.qext = data; }
    });

    return {
        initialProperties: {
            showTitles: false,
            disableNavMenu: true,
            qHyperCubeDef: {
                qDimensions: [],
                qInitialDataFetch: [{
                    qWidth: 1,
                    qHeight: 10000
                }]
            }
        },

        definition: {
            type: "items",
            component: "accordion",
            items: {
                di: {
                    uses: "dimensions",
                    min: 1,
                    max: 1
                },
                so: {
                    uses: "sorting"  // no more needed. 
                },
                se: {
                    uses: "settings"
                },
                ao: {
                    uses: "addons",
                    items: {
                        dataHandling: {
                            uses: "dataHandling",
                            items: {
                                calcCond: {
                                    uses: "calcCond"
                                }
                            }
                        }
                    }
                },
                es: {
                    label: 'Extension Settings',
                    type: 'items',
                    items: props.settings()
                },
                ab: {
                    label: 'About this extension',
                    type: 'items',
                    items: props.about(kpiTrellisGlobal.qext)
                }
            }
        },
        snapshot: {
            canTakeSnapshot: false
        },


        resize: function ($element, layout) {

            const ownId = layout.qInfo.qId;
            const parentWidth = $(`[tid="${ownId}"] .qv-object-content`).width();
            $(`[tid="${ownId}"] .kpi-trellis-elem`).css('width', findIdealWidth(layout.pWidth, parentWidth))
            return qlik.Promise.resolve();
        },

        paint: function ($element, layout) {

            var self = this;
            const ownId = layout.qInfo.qId;
            const app = qlik.currApp(this);
            const enigma = app.model.enigmaModel;
            const currSheet = qlik.navigation.getCurrentSheetId().sheetId;
            const mode = qlik.navigation.getMode();


            if (!Object(kpiTrellisGlobal).hasOwnProperty(ownId)) {
                // create a chart array first time
                kpiTrellisGlobal[ownId] = { charts: [] };
            } else {
                // clear the existing charts, they will be re-rendered
                const chartCount = kpiTrellisGlobal[ownId].charts.length;
                // console.log('need to clear ' + chartCount + ' charts', kpiTrellisGlobal[ownId].charts);
                for (var i = 0; i < chartCount; i++) {
                    kpiTrellisGlobal[ownId].charts[0].close();
                    kpiTrellisGlobal[ownId].charts.splice(0, 1);
                }
                // console.log('cleared ' + chartCount + ' charts', kpiTrellisGlobal[ownId].charts);
            }
            console.log(ownId, 'paint method', kpiTrellisGlobal);

            $(`#${ownId}_content`).css('overflow', 'auto'); // add scrollbars if too small

            var html = '<div class="kpi-trellis-parent">';


            const kpiList = layout.qHyperCube.qDataPages[0].qMatrix;

            var i = 0;
            for (const kpi of kpiList) {
                i++;
                if (i <= maxCharts) {
                    const kpiVar = kpi[0].qText;
                    //const isLast = i == maxCharts || i == kpiList.length;
                    //const divStyles = (!isLast ? `flex:25%;min-width:${layout.pWidth}px;` : `width:${layout.pWidth}px;`)
                    //    + `height:${layout.pHeight}px;`;
                    const divStyles = `width:${layout.pWidth}px;height:${layout.pHeight}px;`;
                    html += `<div class="kpi-trellis-elem" id="${ownId}_${hash(kpiVar)}" style="${divStyles}"></div>`;

                    if (layout.pVisType == 'kpi') {
                        app.visualization.create('kpi', [`=$(${kpiVar})`])
                            .then(function (chart) {
                                kpiTrellisGlobal[ownId].charts.push(chart);
                                chart.show(`${ownId}_${kpiVar}`);
                            })
                            .catch(function (err) {
                                console.error(err);
                            });

                    }
                }
            }
            html += '</div>'
            $element.html(html);
            $('.kpi-trellis-parent').parent().parent().css('background-color', layout.pBgColor);

            const parentWidth = $(`[tid="${ownId}"] .qv-object-content`).width();
            const idealWidth = findIdealWidth(layout.pWidth, parentWidth);
            $(`[tid="${ownId}"] .kpi-trellis-elem`).css('width', idealWidth)

            if (layout.pVisType == 'advanced-kpi2') {

                enigma.getObject(layout.pVisId).then((obj) => {
                    return obj.getProperties()
                }).then((props) => {
                    console.log('Got props', props);
                    var i = 0;
                    for (const kpi of kpiList) {
                        i++;
                        if (i <= maxCharts) {
                            const kpiVar = kpi[0].qText;
                            const kpiHash = hash(kpiVar);
                            var propsCopy = JSON.parse(JSON.stringify(props).replace(/\$\(vFlexKPI1\)/g, kpiVar));
                            propsCopy.qInfo = { qType: 'advanced-kpi2' };

                            console.log(propsCopy);
                            app.visualization.create('advanced-kpi2', null, propsCopy)
                                .then(function (chart) {
                                    kpiTrellisGlobal[ownId].charts.push(chart);
                                    chart.show(`${ownId}_${kpiHash}`).then(function () {
                                        $(`#${ownId}_${kpiHash} .qv-object-wrapper`)
                                            .prepend('<div class="open-details">'
                                                + '<span class="lui-icon  lui-icon--line-chart"></span></div>')
                                            .click(function (e) {
                                                popupChart(layout, kpi, ownId, kpiVar, kpiHash, app, enigma)
                                            });
                                    })
                                })
                                .catch(function (err) {
                                    console.error(err);
                                });
                        }
                    }
                    // $(`.kpi-trellis-elem .qv-object-wrapper`).prepend('<div class="open-details">#</div>');
                }).catch((err) => {
                    console.error(err);
                })


                // app.visualization.get(layout.pVisId).then(function (chart) {
                //     kpiTrellisGlobal[ownId].charts.push(chart);
                //     chart.show(`${ownId}_${kpiVar}`);
                // })
                //     .catch(function (err) {
                //         console.error(err);
                //     });

            }

            return qlik.Promise.resolve();

        }
    };

    function findIdealWidth(refWidth, parentWidth) {
        var possibleWidths = [];
        var idealWidth;
        for (var i = 1; i <= 10; i++) {
            const possibleWidth = (parentWidth - 3 * i) / i;
            if (possibleWidth > refWidth) idealWidth = /* possibleWidth + 'px'; */ 'calc(' + (100 / i) + '% - 3px)';
            possibleWidths.push(possibleWidth);
        };
        console.log(parentWidth, idealWidth, possibleWidths);
        return idealWidth; // [1] - idealWidth[0];
    }

    function hash(s) {
        // creates a hash (integer) from a given string s
        var x = 0;
        for (var j = 0; j < s.length; j++) {
            x = ((x << 5) - x) + s.charCodeAt(j)
            x |= 0;
        }
        return Math.abs(x);
    }

    async function popupChart(layout, kpi, ownId, kpiVar, kpiHash, app, enigma) {

        // console.log('kpi', kpi);
        leonardo.msg(ownId, '',
            `<div id="details_${kpiHash}" style="height:600px;"></div>`
            , 'Schliessen', null, '75%');
        var dChart;
        var obj = await enigma.getObject(layout.pDetailVisId)
        var props2 = await obj.getProperties();

        var propsCopy2 = JSON.parse(JSON.stringify(props2)
            .replace(/\$\(vFlexKPI1\)/g, kpiVar)
            .replace(/_last_month/g, ''));
        const chartType = props2.qInfo.qType;
        propsCopy2.qInfo = { qType: chartType };
        console.log('popup chart', propsCopy2);

        // löse $(variable) in den qMeasures in deren definition auf
        // entferne aus der Formel, die in der variable gefunden wird, alle _last_month
        // -> es wird eine andere Formel ausgeführt (die dann den Set-Modifier des letzten Monats entfernt)

        for (var qMeasure of propsCopy2.qHyperCubeDef.qMeasures) {
            console.log('meas', qMeasure.qDef.qDef);
            var variable = qMeasure.qDef.qDef.replace('=$(', '=');
            variable = variable.substr(0, variable.length - 1);
            const res = await enigma.evaluate(variable);

            qMeasure.qDef.qDef = res.replace(/_last_month/g, '');
            console.log('meas', res.replace(/_last_month/g, ''))
        }

        dChart = await app.visualization.create('linechart', null, propsCopy2)
        dChart.show(`details_${kpiHash}`);

        $('#msgok_' + ownId).click(function () {
            try { dChart.close(); } catch (err) { }  // detach object from engine
            $('#msgparent_' + ownId).remove(); // close leonardo window;

        })

    }
});
