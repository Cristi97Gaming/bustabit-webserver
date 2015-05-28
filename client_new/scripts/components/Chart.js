define([
    'lib/react',
    'lib/clib',
    'components/Graph',
    'game-logic/engine'
], function(
    React,
    Clib,
    Graph,
    Engine
){

    var D = React.DOM;

    function getState(){
        return {
            engine: Engine
        }
    }

    return React.createClass({
        displayName: 'Chart',

        getInitialState: function () {
            return getState();
        },

        _onChange: function() {
            //Check if its mounted because when Game view receives the disconnect event from EngineVirtualStore unmounts all views
            //and the views unregister their events before the event dispatcher dispatch them with the disconnect event
            if(this.isMounted())
                this.setState(getState());
        },

        componentWillUnmount: function() {
            Engine.off({
                game_started: this._onChange,
                game_crash: this._onChange,
                game_starting: this._onChange,
                lag_change: this._onChange
            });

            this.mounted = false;
            window.removeEventListener("resize", this._resizeGraph)
        },

        componentDidMount: function() {
            Engine.on({
                game_started: this._onChange,
                game_crash: this._onChange,
                game_starting: this._onChange,
                lag_change: this._onChange
            });

            this.mounted = true;

            var node = this.getDOMNode();
            var height = node.clientHeight;
            var width = node.clientWidth;
            this.graph = new Graph(width, height);
            this.animRequest = window.requestAnimationFrame(this._draw);
            this.setState({ width: width, height: height });

            window.addEventListener("resize", this._resizeGraph);
        },

        _resizeGraph: function() {
            var node = this.getDOMNode();
            var height = node.clientHeight;
            var width = node.clientWidth;
            this.graph.resize(width, height);
        },

        _draw: function() {
            if(this.mounted) { //Set it on component will unmount to immediately stop rendering
                var canvas = this.refs.canvas.getDOMNode();
                if (!canvas.getContext) {
                    console.log('No canvas');
                    return;
                }
                var ctx = canvas.getContext('2d');

                this.graph.setData(ctx, canvas, this.state.engine);
                this.graph.calculatePlotValues();
                this.graph.clean();
                this.graph.drawGraph();
                this.graph.drawAxes();
                this.graph.drawGameData();

                this.animRequest = window.requestAnimationFrame(this._draw);
            }
        },

        render: function() {

            var graph = this.graph? D.canvas({
                width: this.state.width,
                height: this.state.height,
                ref: 'canvas'
            }) : null;

            return D.div({ id: 'chart-inner-container', ref: 'container' },
                D.div({ style: { position: 'absolute', bottom: '27px', right: '30px', fontSize: '55%' }},
                    'Max profit: ', (this.state.engine.maxWin/1e8).toFixed(4), ' BTC'),
                graph
            )
        }
    });
});