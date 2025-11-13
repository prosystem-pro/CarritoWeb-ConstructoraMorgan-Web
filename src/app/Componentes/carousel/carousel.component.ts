import { Input, Component, computed, signal } from '@angular/core';

interface CarouselItem {
  id: number;
  level: number;
  key: number;
  className: string;
  imageUrl: string;
  alt?: string;
}

interface ApiCarouselImage {
  CodigoCarruselImagen: number;
  UrlImagen: string;
  NombreCarruselImagen?: string;
}

@Component({
  selector: 'app-carousel',
  imports: [],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.css'
})
export class CarouselComponent {

  @Input() itemsInput: ApiCarouselImage[] = [];

  items = signal<ApiCarouselImage[]>([]);
  activeIndex = signal(0);
  direction = signal<'left' | 'right'>('right');

  ngOnInit(): void {
    console.log("ItemsInput desde caruosel: ", this.itemsInput)
    // Inicializar items con los datos del Input
    if (this.itemsInput && this.itemsInput.length > 0) {
      this.items.set(this.itemsInput);
    }
  }

  moveLeft(): void {
    this.direction.set('left');
    this.activeIndex.update(currentActive => {
      const newActive = currentActive - 1;
      return newActive < 0 ? this.items().length - 1 : newActive;
    });
  }

  moveRight(): void {
    this.direction.set('right');
    this.activeIndex.update(currentActive => {
      return (currentActive + 1) % this.items().length;
    });
  }

  visibleItems = computed(() => {
    const active = this.activeIndex();
    const allItems = this.items();
    const length = allItems.length;
    const items: CarouselItem[] = [];

    if (length === 0) return items;

    for (let i = active - 1; i < active + 2; i++) {
      let index = i;

      if (i < 0) {
        index = length + i;
      } else if (i >= length) {
        index = i % length;
      }

      const level = active - i;
      const currentItem = allItems[index];

      items.push({
        id: currentItem.CodigoCarruselImagen,
        level: level,
        key: index,
        className: `item level${level < 0 ? '-' : ''}${Math.abs(level)}`,
        imageUrl: currentItem.UrlImagen,
        alt: currentItem.NombreCarruselImagen || `Imagen ${currentItem.CodigoCarruselImagen}`
      });
    }

    return items;
  });
}
