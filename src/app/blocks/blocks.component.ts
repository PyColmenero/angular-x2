import { Component, OnInit } from '@angular/core';
import { ClickService } from '../click.service';
import { ScoreService } from '../score.service';

class Block {
	x: number;
	y: number;
	color: string | undefined;
	number: number;
	lifespan: number;
	block_size: number;
	clickservice: ClickService;
	constructor(x: number, y: number, color: string, number: number, block_size: number, clickservice: ClickService) {
		this.x = x;
		this.y = y;
		this.color = color;
		this.number = number;
		this.lifespan = Date.now();
		this.block_size = block_size;
		this.clickservice = clickservice;
	}
	getx() { return this.x * this.block_size }
	gety() { return this.y * this.block_size }
	getnumber() {
		let number:string = this.number.toString();
		if(number.length > 4){
			return number.substring(0,number.length-3) + "k";
		}
		return number;
	}
	upgrade(power: number) {
		this.number *= power;
		this.color = this.clickservice.block_colors.get(this.number);
		return this.number;
	}
}


@Component({
	selector: 'app-blocks',
	templateUrl: './blocks.component.html',
	styleUrls: ['./blocks.component.css']
})
export class BlocksComponent implements OnInit {

	// timing
	updating: boolean = false;

	// browser & game & cube size
	browser_width: number = 0;
	browser_height: number = 0;
	game_padding: number = 0;
	game_width: number = 0;
	game_height: number = 0;
	block_size: number = 0;

	// level up
	max_upgraded: number;

	// matrix
	blocks_matrix: Block[][] = [];
	// cubes list
	blocks_list: Block[] = [];
	columns_amount: number = 5;
	rows_amount: number = 8;

	// simulated block
	_block: Block;

	// swipe
	swiped: boolean = false;
	swipe_ended: boolean = true;

	constructor(public clickservice: ClickService, public scoreservice: ScoreService) {

		this.set_game_size();
		this.addEventListeners();

		this._block = new Block(0, 0, "", 0, this.block_size, this.clickservice);
		this.max_upgraded = this.clickservice.block_number_odds[this.clickservice.block_number_odds.length - 1] * 8;

		this.game_center = (this.browser_height / 2) - (this.block_size);

	}

	addEventListeners() {
		document.addEventListener('touchstart', this.startSwipeHandler.bind(this), false);
		document.addEventListener('touchmove', this.swipeHandler.bind(this), { passive: false });
		document.addEventListener('touchend', this.endSwipeHandler.bind(this), false);
	}

	endSwipeHandler() {
		this.swipe_ended = true;

		if (this.swiped) {
			// console.log("Simulated click");

			this.click(this.clickservice.selectedcolumn);
		}

		this.clickservice.selectedcolumn = -1;
		this.swiped = false;

	}

	simulate_swipe: boolean = false;
	startSwipeHandler(e: any) {

		this.swipe_ended = false;

		setTimeout(() => {
			this.simulate_swipe = true;
			if (!this.swiped) {
				this.swipeHandler(e);
			}
			this.simulate_swipe = false;
		}, 100);
	}

	show_simulate_block: boolean = false;

	swipeHandler(e: any) {

		// console.log("swipe");
		e.preventDefault();
		e.stopPropagation();

		if (this.swipe_ended) return;
		if (!this.simulate_swipe) this.swiped = true;

		let x: number = e.changedTouches[0].clientX;

		this.clickservice.selectedcolumn = this.getColumnByCoordinate(x - this.game_padding);

		this.update_simulated_block(this.clickservice.selectedcolumn);

		setTimeout(() => { this.show_simulate_block = true }, 100)

	}

	getColumnByCoordinate(x: number) {
		return Math.floor(x / this.block_size);
	}


	add_block_to_list(x: number, y: number, color: string, number: number) {

		let block: Block = new Block(x, y, color, number, this.block_size, this.clickservice);

		this.blocks_list.push(block);

	}
	update_simulated_block(x: number) {

		let y: number = 0;

		const column_list = this.blocks_matrix[x];
		if (column_list) {
			const block = column_list[column_list.length - 1];
			y += block.y + 1;
		}

		this._block.x = x;
		this._block.y = y;
		this._block.color = this.clickservice.block_color;
		this._block.number = this.clickservice.block_number;

		// console.log(this.clickservice.selectedcolumn, x, y, this._block.color, this._block.number);
	}

	click(column: number) {

		if (this.updating) return;

		if (column < 0 || column > this.columns_amount - 1) return;


		// setted block
		let block_number: number = this.clickservice.block_number;
		let block_color: string | undefined = this.clickservice.block_color;
		if (block_color === undefined)
			block_color = "";

		// add score
		this.scoreservice.set_score(block_number);

		// pof
		this.add_block_to_list(column, this.rows_amount, block_color, block_number);
		this.clickservice.next();
		setTimeout(this.update.bind(this), 10)

	}

	get_block_to_fall_over(checkedblock: Block) {
		let y: number = 0;
		for (const block of this.blocks_list) {
			if (checkedblock.lifespan != block.lifespan) { // que no sea yo mismo
				if (block.y < this.rows_amount) { // no salir del límite de las 7 filas
					if (block.x == checkedblock.x) { // misma columna
						if (block.y < checkedblock.y) { // no subir vamos
							if (block.y >= y) { // sacar el mayor de todos
								y = block.y + 1;
							}
						}
					}
				}
			}
		}
		return y;
	}

	raiseBlock(list_index: number) {

		let block: Block = this.blocks_list[list_index];
		let y: number = this.get_block_to_fall_over(block);
		block.y = y;

	}

	block_placed() {
		this.updating = false;
		this.merge_blocks();
	}

	create_matrix() {

		this.blocks_matrix = [];
		for (const block of this.blocks_list) {
			if (!this.blocks_matrix[block.x]) this.blocks_matrix[block.x] = []
			this.blocks_matrix[block.x][block.y] = block;
		}

	}

	merge_blocks() {

		let updated = false;

		this.create_matrix();

		updated = this.marge_4w_blocks();
		if (updated) return;
		updated = this.marge_3w_blocks();
		if (updated) return;
		updated = this.marge_2w_blocks();

	}
	marge_4w_blocks() {

		let necessary_update: boolean = false;
		let upgraded = 0;

		for (let x = 0; x < this.blocks_list.length; x++) {

			const checkblock = this.blocks_list[x];
			let mergedleft;
			let mergedright;
			let mergedup;

			// MERGE ARRIBA DERECHA IZQUIERDA	
			mergedleft = this.merge_left(checkblock);
			mergedright = this.merge_right(checkblock);
			mergedup = this.merge_up(checkblock);

			if (mergedleft && mergedright && mergedup) {

				upgraded = checkblock.upgrade(8 * 2);
				this.remove_from_blockslist(mergedup);
				this.remove_from_blockslist(mergedleft);
				this.remove_from_blockslist(mergedright);

				// add score
				this.scoreservice.set_score(checkblock.number);

				necessary_update = true;
				break;
			}

		}

		if (necessary_update) {
			if (upgraded) {
				if (this.max_upgraded < upgraded) {
					this.levelup(upgraded);
				}
			}
			this.create_matrix();
			setTimeout(this.update.bind(this), 0);
		}
		return necessary_update;

	}
	marge_3w_blocks() {

		let necessary_update: boolean = false;
		let upgraded = 0;

		for (let x = 0; x < this.blocks_list.length; x++) {

			const checkblock = this.blocks_list[x];
			let mergedleft;
			let mergedright;
			let mergedup;

			// MERGE ARRIBA IZQUIERDA	
			mergedleft = this.merge_left(checkblock);
			mergedup = this.merge_up(checkblock);
			if (mergedleft && mergedup) {

				upgraded = checkblock.upgrade(4 * 2);
				this.remove_from_blockslist(mergedup);
				this.remove_from_blockslist(mergedleft);

				// add score
				this.scoreservice.set_score(checkblock.number);

				necessary_update = true;
				break;
			}

			// MERGE ARRIBA DERECHA	
			mergedright = this.merge_right(checkblock);
			mergedup = this.merge_up(checkblock);
			if (mergedright && mergedup) {

				upgraded = checkblock.upgrade(4 * 2);
				this.remove_from_blockslist(mergedup);
				this.remove_from_blockslist(mergedright);

				// add score
				this.scoreservice.set_score(checkblock.number);

				necessary_update = true;
				break;
			}

			// MERGE IZQUIERDA DERECHA	
			mergedright = this.merge_right(checkblock);
			mergedleft = this.merge_left(checkblock);
			if (mergedright && mergedleft) {

				upgraded = checkblock.upgrade(4 * 2);
				this.remove_from_blockslist(mergedleft);
				this.remove_from_blockslist(mergedright);

				// add score
				this.scoreservice.set_score(checkblock.number);

				necessary_update = true;
				break;
			}

		}

		if (necessary_update) {
			if (upgraded) {
				if (this.max_upgraded < upgraded) {
					this.levelup(upgraded);
				}
			}
			this.create_matrix();
			setTimeout(this.update.bind(this), 0);
		}
		return necessary_update;

	}



	marge_2w_blocks() {

		let necessary_update: boolean = false;
		let upgraded: number = 0;
		for (let x = 0; x < this.blocks_list.length; x++) {

			const checkblock = this.blocks_list[x];

			let mergeblock: Block | undefined = undefined;
			let b: Block | undefined = undefined;

			// MERGE IZQUIERDA	
			b = this.merge_left(checkblock);
			if (b) mergeblock = b;

			// MERGE DERECHA
			b = this.merge_right(checkblock);
			if (b) mergeblock = b;

			// MERGE ARRIBA
			b = this.merge_up(checkblock);
			if (b) mergeblock = b;


			if (mergeblock) {
				if (mergeblock.lifespan > checkblock.lifespan) {
					upgraded = mergeblock.upgrade(2);
					this.remove_from_blockslist(checkblock);
					// add score
					this.scoreservice.set_score(mergeblock.number);
				} else {
					upgraded = checkblock.upgrade(2);
					this.remove_from_blockslist(mergeblock);
					// add score
					this.scoreservice.set_score(checkblock.number);
				}

				necessary_update = true;
				break;
			}


		}

		if (necessary_update) {
			if (upgraded) {
				if (this.max_upgraded < upgraded) {
					this.levelup(upgraded);
				}
			}
			this.create_matrix();
			setTimeout(this.update.bind(this), 0);
		}
		return necessary_update;

	}
	level: number = 0;
	level_color: string | undefined = "";
	show_level_up: boolean = false;
	game_center: number;


	getnumber(level:number) {
		let number:string = this.level.toString();
		if(number.length > 4){
			return number.substring(0,number.length-3) + "k";
		}
		return number;
	}
	level_number:string = "";
	levelup(level: number) {

		let levels_in_row = this.get_levels_in_row(this.max_upgraded, level);
		this.level = level * levels_in_row;
		this.level_number = this.getnumber(level);
		this.level_color = this.clickservice.block_colors.get(level);
		this.show_level_up = true;
		this.max_upgraded = level;
		let number = this.clickservice.upgrade();
		setTimeout(() => {
			this.show_level_up = false;
			for (let x = 0; x < levels_in_row; x++) {
				if (number) {
					console.log(number);

					this.delete_all_blocks_like(number);
					if (x != levels_in_row - 1) {
						number = this.clickservice.upgrade();
						console.log("upgraded:", number);

					}
				}
			}

			this.update();
			this.clickservice.next();
		}, 1000)

	}
	get_levels_in_row(maxlevel: number, level: number) {
		let levelsinrow = 0;
		while (true) {
			levelsinrow++;
			level /= 2;
			if (maxlevel == level) break;
		}
		return levelsinrow;
	}
	delete_all_blocks_like(number: number | undefined) {
		if (number) {
			this.blocks_list = this.blocks_list.filter(block => block.number != number);
		}
	}
	merge_left(checkblock: Block) {
		if (checkblock.x != 0) { // si no está en la pared izquierda
			let column = this.blocks_matrix[checkblock.x - 1];
			if (column) {
				let block = column[checkblock.y];
				if (block) {
					if (block.number == checkblock.number) {
						return block;
					}
				}
			}
		}
		return undefined;
	}
	merge_right(checkblock: Block) {
		if (checkblock.x != 4) { // si no está en la pared derecha
			let column = this.blocks_matrix[checkblock.x + 1];
			if (column) {
				let block = column[checkblock.y];
				if (block) {
					if (block.number == checkblock.number) {
						return block;
					}
				}
			}
		}
		return undefined;
	}
	merge_up(checkblock: Block) {
		if (checkblock.y != 0) { // si no está en la primera linea
			let column = this.blocks_matrix[checkblock.x];
			if (column) {
				let block = column[checkblock.y - 1];
				if (block) {
					if (block.number == checkblock.number) {
						return block;
					}
				}
			}
		}
		return undefined;
	}
	remove_from_blockslist(block: Block) {

		this.blocks_list = this.blocks_list.filter(x => x.lifespan != block.lifespan)

	}

	update() {

		this.create_matrix();

		this.updating = true;

		for (let index = 0; index < this.blocks_list.length; index++) {
			const block = this.blocks_list[index];
			if (!this.block_has_block_over(block)) {
				this.raiseBlock(index);
			}
		}

		setTimeout(this.block_placed.bind(this), 500);

	}
	block_has_block_over(checkedblock: Block) {
		if (checkedblock.y == 0) {
			return true;
		}

		for (let x = 0; x < this.blocks_list.length; x++) {
			const block = this.blocks_list[x];
			if (checkedblock.y == block.y + 1) {
				if (checkedblock.x == block.x) {
					return true;
				}
			}
		}

		return false;
	}
	equal(x: number, y: number) {

		return (x > y - 5 && x < y + 5)

	}


	set_game_size() {
		this.browser_width = window.innerWidth;
		this.browser_height = window.innerHeight;
		if(this.browser_width < this.browser_height){
			this.game_width = (this.browser_width * 0.88) - 4;
			this.game_padding = (this.browser_width - this.game_width) / 2;
		} else {
			this.game_width = (this.browser_height * 0.44) - 4;
			this.game_padding = (this.browser_width - this.game_width) / 2;
		}

		this.block_size = this.game_width / this.columns_amount;
	}

	ngOnInit(): void { }



}
