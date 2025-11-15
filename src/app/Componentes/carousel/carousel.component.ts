import { Input, Component, computed, signal, ViewChild  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModalComponent } from '../carousel-modal/carousel-modal.component';
import { PermisoServicio } from '../../Autorizacion/AutorizacionPermiso';
import { CarruselImagen } from '../../Modelos/CarruselImagen';

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
  CodigoCarrusel?: number;
  Orden?: string;
  Estatus?: number;
}

@Component({
  selector: 'app-carousel',
  imports: [CommonModule, CarouselModalComponent],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.css'
})
export class CarouselComponent {

  @Input() itemsInput: ApiCarouselImage[] = [];
  @Input() codigoCarrusel: number = 0;

  items = signal<ApiCarouselImage[]>([]);
  activeIndex = signal(0);
  direction = signal<'left' | 'right'>('right');
  @ViewChild('modalCarrusel') modalCarrusel!: CarouselModalComponent;

  constructor(public Permiso: PermisoServicio) {}

  ngOnInit(): void {
    console.log("ItemsInput desde carrusel: ", this.itemsInput);
    if (this.itemsInput && this.itemsInput.length > 0) {
      this.items.set(this.itemsInput);
    }
  }

  // Computed para convertir items() a formato CarruselImagen para el modal
  convertirParaModal = computed(() => {
    return this.items().map(img => ({
      CodigoCarruselImagen: img.CodigoCarruselImagen,
      UrlImagen: img.UrlImagen,
      NombreCarruselImagen: img.NombreCarruselImagen,
      CodigoCarrusel: img.CodigoCarrusel || this.codigoCarrusel,
      Orden: img.Orden || '0',
      Estatus: img.Estatus || 1
    } as CarruselImagen));
  });

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

  abrirModalEdicion(): void {
    this.modalCarrusel.abrirModal();
  }

  actualizarImagenes(imagenesActualizadas: CarruselImagen[]): void {
    // Convertir CarruselImagen[] a ApiCarouselImage[]
    const imagenesConvertidas: ApiCarouselImage[] = imagenesActualizadas
      .filter(img => img.CodigoCarruselImagen !== undefined)
      .map(img => ({
        CodigoCarruselImagen: img.CodigoCarruselImagen!,
        UrlImagen: img.UrlImagen || '',
        NombreCarruselImagen: img.NombreCarruselImagen,
        CodigoCarrusel: img.CodigoCarrusel,
        Orden: img.Orden,
        Estatus: img.Estatus
      }));

    this.items.set(imagenesConvertidas);
  }
}