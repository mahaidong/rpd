var nodetypes = {};
var linktypes = {};
var channeltypes = {};

var renderer_registry = {};

function report_error(desc, err) {
    var err = err || new Error(desc);
    if (console) (console.error ? console.error(err) : console.log(err));
    throw err;
}

function Model() {
    this.nodes = Kefir.emitter();
    this.targets = Kefir.emitter();
    this.renderers = Kefir.emitter();

    function rev_cons(prev, cur) {
        return [ cur, Array.isArray(prev) ? prev : [ prev, null ] ];
    };

    function walk_cons(cell, f) {
        if (!cell) return;
        f(cell[0]); walk_cons(cell[1], f);
    }

    Kefir.combine([ this.nodes,
                    this.targets.scan(rev_cons),
                    this.renderers.scan(rev_cons) ]).onValue(
        function(value) {
            var node = value[0], targets = value[1],
                                 renderers = value[2];
            walk_cons(targets, function(target) {
                walk_cons(renderers, function(renderer) {
                    if (!renderer_registry[renderer]) report_error('Renderer ' + renderer +
                                                                   ' is not registered.');
                    renderer_registry[renderer](target, node);
                });
            });
        }
    );
}
Model.prototype.attachTo = function(elm) {
    this.targets.emit(elm);
    return this;
}
Model.prototype.add = function(node) {
    this.nodes.emit(node);
    return this;
}
Model.prototype.update = function(node) {
    this.nodes.emit(node);
    return this;
}
Model.prototype.renderWith = function(alias) {
    this.renderers.emit(alias);
    return this;
}

function Node(type, name) {
    this.type = type || 'core/empty';
    var def = nodetypes[this.type];
    if (!def) report_error('Node type ' + this.type + ' is not registered!');
    this.def = def;

    this.name = name || def.name || 'Unnamed';
    this.inlets = [];
    this.outlets = [];
    this.def = def;
}

function Link(type, name) {
    this.type = type || 'core/direct';
    var def = linktypes[this.type];
    if (!def) report_error('Link type ' + this.type + ' is not registered!');
    this.def = def;

    this.name = name || def.name || '';
    this.start = null;
    this.end = [];
}

function Channel(type, name) {
    this.type = type || 'core/bool';
    var def = linktypes[this.type];
    if (!def) report_error('Channel type ' + this.type + ' is not registered!');
    this.def = def;

    this.name = name || def.name || 'Unnamed';
    this.node = null;
}

function nodetype(id, def) {
    nodetypes[id] = def;
}

function linktype(id, def) {
    linktypes[id] = def;
}

function channeltype(id, def) {
    channeltypes[id] = def;
}

function renderer(alias, f) {
    renderers[alias] = f;
}