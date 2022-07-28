import { Component, OnInit } from '@angular/core';
import { ClickService } from '../click.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  constructor(public clickservice: ClickService) { }

  ngOnInit(): void { }

}
