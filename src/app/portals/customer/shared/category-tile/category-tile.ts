import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-category-tile',
  imports: [RouterLink],
  templateUrl: './category-tile.html',
  styleUrl: './category-tile.css'
})
export class CategoryTile {
  readonly label = input.required<string>();
  readonly categorySlug = input.required<string>();
  readonly dishCount = input<number>(0);
}
