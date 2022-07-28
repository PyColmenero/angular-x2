import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScoreService {

  score:number = 0;
  constructor() { }
  set_score(score:number){
    this.score += score;
  }
}
