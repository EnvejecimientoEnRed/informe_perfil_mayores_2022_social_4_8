//Desarrollo de las visualizaciones
import * as d3 from 'd3';
import { numberWithCommas3 } from '../helpers';
import { getInTooltip, getOutTooltip, positionTooltip } from '../modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C';
let tooltip = d3.select('#tooltip');

export function initChart(iframe) {
    //Lectura de datos
    d3.csv('https://raw.githubusercontent.com/EnvejecimientoEnRed/informe_perfil_mayores_2022_social_4_8/main/data/contribuciones_abuelos_sociedad_cis_2018.csv', function(error,data) {
        if (error) throw error;
        
        data.sort(function(x, y){
            return d3.descending(+x.valor_contribucion, +y.valor_contribucion);
        });

        let margin = {top: 12.5, right: 20, bottom: 25, left: 140},
            width = document.getElementById('chart').clientWidth - margin.left - margin.right,
            height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;

        let svg = d3.select("#chart")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let x = d3.scaleLinear()
            .domain([0, 40])
            .range([ 0, width]);

        let xAxis = function(svg) {
            svg.call(d3.axisBottom(x).ticks(4));
            svg.call(function(g){
                g.selectAll('.tick line')
                    .attr('class', function(d,i) {
                        if (d == 0) {
                            return 'line-special';
                        }
                    })
                    .attr('y1', '0')
                    .attr('y2', `-${height}`)
            });
        }

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        let y = d3.scaleBand()
            .range([ 0, height ])
            .domain(data.map(function(d) { return d.tipo_contribucion; }));

        let yAxis = function(svg) {
            svg.call(d3.axisLeft(y));
            svg.call(function(g){g.selectAll('.domain').remove()});
            svg.call(function(g){g.selectAll('.tick line').remove()});
            svg.selectAll('.tick text')
            .call(wrap, 130);
        }

        svg.append("g")
            .call(yAxis);
        
        function init() {
            svg.selectAll("bars")
                .data(data)
                .enter()
                .append("rect")
                .attr('class','rect')
                .attr("x", x(0) )
                .attr("y", function(d) { return y(d.tipo_contribucion) + y.bandwidth() / 4; })
                .attr("width", function(d) { return x(0); })
                .attr("height", y.bandwidth() / 2 )
                .attr("fill", COLOR_PRIMARY_1)
                .on('mouseover', function(d,i,e) {
                    //Opacidad de las barras
                    let bars = svg.selectAll('.rect');  
                    bars.each(function() {
                        this.style.opacity = '0.4';
                    });
                    this.style.opacity = '1';

                    //Texto
                    let html = '<p class="chart__tooltip--title">' + d.tipo_contribucion + '</p>' + 
                    '<p class="chart__tooltip--text">Un <b>' + numberWithCommas3(parseFloat(d.valor_contribucion).toFixed(1)) + '%</b> de abuelos y abuelas contribuye con esta forma</p>';
            
                    tooltip.html(html);

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);
                })
                .on('mouseout', function(d,i,e) {
                    //Quitamos los estilos de la línea
                    let bars = svg.selectAll('.rect');
                    bars.each(function() {
                        this.style.opacity = '1';
                    });
                
                    //Quitamos el tooltip
                    getOutTooltip(tooltip);
                })
                .transition()
                .duration(2000)
                .attr("width", function(d) { return x(+d.valor_contribucion); });
        }

        function animateChart() {
            svg.selectAll(".rect")
                .attr("width", function(d) { return x(0); })
                .transition()
                .duration(1500)
                .attr("width", function(d) { return x(+d.valor_contribucion); })
        }

        /////
        /////
        // Resto - Chart
        /////
        /////
        init();

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            animateChart();

            setTimeout(() => {
                setChartCanvas(); 
            }, 4000);
        });

        /////
        /////
        // Resto
        /////
        /////

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_social_4_8','contribuciones_abuelos');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('contribuciones_abuelos');

        //Captura de pantalla de la visualización
        setTimeout(() => {
            setChartCanvas(); 
        }, 4000);    

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('contribuciones_abuelos');
        });

        //Altura del frame
        setChartHeight();
    });    
}

function wrap(text, width) {
    text.each(function() {
        let text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            y = text.attr("y"),
            dy = words.length == 2 && words[1] != 'Ayudar' ? 0.35 : words[0] == 'padres' ? -0.5 : -0.25,
            tspan = text.text(null).append("tspan").attr("x", -10).attr("y", y).attr("dy", + dy + "em");

        if(words.length == 8) {
            let lines = 0.5;
            while (word = words.pop()) {                
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", -10).attr("y", y).attr("dy", lines + "em").text(word);
                    lines += 1;
                }
            }
        } else {
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", -10).attr("y", y).attr("dy", 1 + "em").text(word);
                }
            }
        }

        
    });
};