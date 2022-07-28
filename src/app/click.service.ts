import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class ClickService {
	
	// next block
	block_number: number = 2;
	block_color: string|undefined = "";
	
	// num+color
	block_number_odds:number[] = [2,4,8,16,32,64];
	block_colors = new Map<number, string>();
	
	// selected column
	selectedcolumn:number = -1;

	constructor() { 
		this.generate_block_colors();
	}
	
	upgrade() {
		this.block_number_odds.push(this.block_number_odds[this.block_number_odds.length-1]*2);
		return this.block_number_odds.shift();		
	}
	
	generate_block_colors(){
		this.block_colors.set(2,"#FFFF00");
		this.block_colors.set(4,"#FF0018");
		this.block_colors.set(8,"#FF008C");
		this.block_colors.set(16,"#9CFF4A");
		this.block_colors.set(32,"#7C29FF");
		this.block_colors.set(64,"#A46A38");
		this.block_colors.set(128,"#3F9999");
		this.block_colors.set(256,"#5D859E");
		this.block_colors.set(512,"#00EB5E");
		this.block_colors.set(1024,"#5FB200");
		this.block_colors.set(2048,"#C01564");
		this.block_colors.set(4096,"#957369");
		this.block_colors.set(8192,"#FF0018");
		this.block_colors.set(8192*2,"#FF66FF");
		this.block_colors.set(8192*4,"#FF656D");
		this.set_block_color();
	}

	next() {
		this.block_number = Math.random() * this.block_number_odds.length;
		this.block_number = parseInt(this.block_number.toString());
		this.block_number = this.block_number_odds[this.block_number];
		// this.block_number = 64;

		this.set_block_color();
	}

	set_block_color(){
		this.block_color = this.block_colors.get(this.block_number);
	}

}
