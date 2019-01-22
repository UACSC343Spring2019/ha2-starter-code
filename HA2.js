var sharks  = {
    signal: {
	increment: 'INCREMENT',
	add: 'ADD'
    },
    animal: {
	FISH: 1,
	SHARK: 2
    },
    movement: {
	RIGHT: 1,
	LEFT: -1
    }
};

document.addEventListener("DOMContentLoaded", function(event) {
});


// makeSignaller creates signaller objects (from lecture)
var makeSignaller = function() {
    var _subscribers = [];

    return {
	// Add a subscriber function to our list
	add: function(s) {
	    _subscribers.push(s);
	},

	// Notify all subscribers by calling the function
	// in our list with the passed arguments.
	notify: function(args) {
	    for (var i = 0; i < _subscribers.length; i++) {
		_subscribers[i](args);
	    }
	}
    };
}


// makeModel creates the model.
//
// In this case, the model is the entire Fish Grid
var makeModel = function() {
    var _gridx = 0;
    var _gridy = 0;
    var _grid = [];
    var _observers = makeSignaller();

    // This getRandomInt function from 
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    var _getRandomInt = function(max) {
	return Math.floor(Math.random() * Math.floor(max));
    }

    // Creates a new grid of fish cells
    //
    // Inputs:
    //   x: the x dimension of the grid
    //   y: the y dimension of the grid
    //
    // Returns:
    //   The grid as represented by an array of arrays
    var _createGrid = function(x, y) {
	var new_grid = [];
	for (var i = 0; i < y; i++) {
	    new_grid.push([]);
	    for (var j = 0; j < x; j++) {
		new_grid[i].push(makeFishCell());
	    }
	}
	_gridx = x;
	_gridy = y;
	return new_grid;
    };

    // Adds a fish object to the grid
    //
    // Inputs:
    //   x: the x coordinate to add to
    //   y: the y coordinate to add to
    //   fish: the fish object to add
    var _addToCell = function(x, y, fish) {
	_grid[y][x].addFish(fish);
    }

    // Moves the given fish in the grid
    //
    // Inputs:
    //   x: the initial x coordinate of the given fish
    //   y: the initial y coordinate of the given fish
    //   fish: the fish object to move
    //
    // Returns:
    //   The new position of the fish as an object {x, y}
    var _moveFish = function(x, y, fish) {
	var position = {
	    x: x,
	    y: y
	};

	// Fish type determines the stride
	// Fish movement determines the direction in integers
	// Fish vertical determines whether the move is horizontal or vertical
	var distance = fish.type() * fish.movement();
	if (fish.isVertical()) {
	    var newy = (y + distance + _gridy) % _gridy;
	    position.y = newy;
	} else {
	    var newx = (x + distance + _gridx) % _gridx;
	    position.x = newx;
	}

	fish.move(); // Perform the internal move operation
	return position;
    };

    // Creates a new fish conceived at grid point x, y
    //
    // Inputs:
    //   x: the x coordinate where the fish is conceived
    //   y: the y coordinate there the fish is conceived
    var _birthFish = function(x, y) {

	// Find all the valid positions.
	//
	// Valid positions are in the 9-point stencil around the given point
	//   but do not include the point itself
	// Valid positions have no sharks.
	var positionPos = [];
	for (var i = -1; i < 1; i++) {
	    for (var j = -1; j < 1; j++) {
		var tmpX = (x + i + _gridx) % _gridx;
		var tmpY = (y + i + _gridy) % _gridy;
		if (_grid[tmpY][tmpX].numSharks() === 0 && 
		(tmpX !== 0 || tmpY !== 0)) {
		    positionPos.push({
			x: tmpX,
			y: tmpY
		    });
		}
	    }
	}

	// If there is no valid cell, do not birth fish
	if (positionPos.length < 1) {
	    return;
	}

	// Get random position of the valid positions
	var idx = _getRandomInt(positionPos.length);

	// Get random direction
	var dir = _getRandomInt(2);
	var right = sharks.movement.RIGHT;
	if (dir === 0) {
	    right = sharks.movement.LEFT;
	}

	// Add fish to chosen position
	_addToCell(positionPos[idx].x, positionPos[idx].y,
	    makeFish(sharks.animal.FISH, right));
    }

    // Run one timestep of the simulation, moving all of the fish
    // and handling any birth and death events.
    var _incrementTime = function() {
	// Create new grid for final solution
	var newGrid = _createGrid(_gridx, _gridy);

	// Move all fish to new location
	for (var i = 0; i < _gridy; i++) {
	    for (var j = 0; j < _gridx; j++) {
		var cell = _grid[i][j];
		var fishList = cell.fish();
		for (var k = 0; k < fishList.length; k++) 
		{
		    var newPos = _moveFish(j, i, fishList[k]);
		    console.log(newPos, "is new Pos");
		    newGrid[newPos.y][newPos.x].addFish(fishList[k]);
		}
		fishList = cell.sharks();
		for (var k = 0; k < fishList.length; k++) 
		{
		    var newPos = _moveFish(j, i, fishList[k]);
		    newGrid[newPos.y][newPos.x].addFish(fishList[k]);
		}
	    }
	}
	_grid = newGrid;

	// Handle deaths and births
	// - sharks never die but eat all fish in their cell before
	//   they can give birth
	// - if there are two or more fish in a cell, they give birth 
	//   to 1 fish at a randomly chosen adjacent cell that does not
	//   have a shark. The new fish has randomly chosen movement.
	for (var i = 0; i < _gridy; i++) {
	    for (var j = 0; j < _gridx; j++) {
		if (_grid[i][j].numSharks() > 0) {
		    _grid[i][j].eatAllFish();
		}

		if (newGrid[i][j].numFish() >= 2 && newGrid[i][j].numFish() < 10) {
		    _birthFish(i, j);
		}
	    }
	}
    };

    return {
	// Increment time in the simulation
	increment: function() {
	    _incrementTime();
	    _observers.notify();
	},

	// Returns the size of the current grid
	getGridSize: function() {
	    return {
		x: _gridx,
		y: _gridy
	    };
	},

	// Returns an object containing the number
	// of fish and the number of sharks in the
	// grid cell x, y
	getGridCellCounts: function(x, y) {
	    return {
		fish: _grid[y][x].numFish(),
		sharks: _grid[y][x].numSharks()
	    }
	},

	// Adds a fish to a given cell
	//
	// Inputs:
	//   x: x coordinate of cell where fish is added
	//   y: y coordinate of cell where fish is added
	//   type: fish or shark as defined by sharks.animal
	//   dir: direction fish moves in as defined by sharks.movement
	addFish: function(x, y, type, dir) {
	    if (x < _gridx && y < _gridy) {
		_addToCell(x, y, makeFish(type, dir));
		_observers.notify();
	    }
	},

	// Refreshes grid to an empty grid with dimensions x, y
	renewGrid: function(x, y) {
	    _grid = _createGrid(x, y);
	    _observers.notify();
	},

	// Register observer functions
	register: function(fxn) {
	    _observers.add(fxn);
	}
    };
}

// Creates a Fish object of either type.
//
// Inputs:
//   animType: The type of animal as defined by sharks.animal
//   starMov: The movement direction as defined by sharks.movement
var makeFish = function(animType, startMov) {
    var _animalType = animType;
    var _vertical = true;
    var _movement = startMov;

    return {
	type: function() { return _animalType; },
	isVertical: function() { return _vertical; },
	movement: function() { return _movement; },

	move: function() { _vertical = ! _vertical; } 
    };
}   

// Creates a Fish Cell object. This object represents the state of 
// the cell in the grid.
var makeFishCell = function() {
    var _fish = [];
    var _sharks = [];

    return {
	fish: function() { return _fish; },
	sharks: function() { return _sharks; },
	numFish: function() { return _fish.length; },
	numSharks: function() { return _sharks.length; },
	addFish: function(fish) { 
	    if (fish.type() === sharks.animal.FISH) {
		_fish.push(fish);
	    } else {
		_sharks.push(fish);
	    }
	},
	eatAllFish: function() {
	    _fish = [];
	}
    };
}
