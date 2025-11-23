import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarruselImagen } from '../../Modelos/CarruselImagen';
import { Carrusel } from '../../Modelos/Carrusel';

@Component({
  selector: 'app-carousel-proyecto',
  imports: [CommonModule],
  templateUrl: './carousel-proyecto.component.html',
  styleUrl: './carousel-proyecto.component.css'
})
export class CarouselProyectoComponent implements OnInit, OnChanges {
  @Input() proyecto!: Carrusel;
  @Input() imagenes: CarruselImagen[] = [];
  @Input() indicePaginacion: number = 0;
  @Input() modoAdmin: boolean = false;

  @Output() editarProyecto = new EventEmitter<Carrusel>();
  @Output() eliminarProyecto = new EventEmitter<number>();
  @Output() administrarImagenes = new EventEmitter<Carrusel>();

  titulo: string = '';
  subtitulo: string = '';
  imagenesActivas: CarruselImagen[] = [];
  carouselId: string = '';

  ngOnInit(): void {
    this.generarCarouselId();
    this.separarTituloSubtitulo();
    this.actualizarImagenesActivas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // cuando imagenes o proyecto cambian (porque vienen async), actualizamos
    if (changes['imagenes'] || changes['proyecto'] || changes['indicePaginacion']) {
      this.generarCarouselId();
      this.separarTituloSubtitulo();
      this.actualizarImagenesActivas();
    }
  }

  generarCarouselId(): void {
    const codigo = this.proyecto?.CodigoCarrusel || 0;
    // Añadimos indicePaginacion como fallback para garantizar unicidad
    this.carouselId = `carouselProyecto_${codigo}_${this.indicePaginacion}`;
  }

  separarTituloSubtitulo(): void {
    this.titulo = '';
    this.subtitulo = '';
    if (this.proyecto?.NombreCarrusel) {
      const partes = this.proyecto.NombreCarrusel.split('|');
      this.titulo = partes[0]?.trim() || '';
      this.subtitulo = partes[1]?.trim() || '';
    }
  }

  actualizarImagenesActivas(): void {
    this.imagenesActivas = (this.imagenes || [])
      .filter(img => img.Estatus === 1)
      .sort((a, b) => Number(a.Orden || 0) - Number(b.Orden || 0))
      .slice(0, 3); // máximo 3 aquí (aquí es el lugar correcto)
  }

  onEditarProyecto(): void {
    this.editarProyecto.emit(this.proyecto);
  }

  onEliminarProyecto(): void {
    if (this.proyecto?.CodigoCarrusel) {
      this.eliminarProyecto.emit(this.proyecto.CodigoCarrusel);
    }
  }

  onAdministrarImagenes(): void {
    this.administrarImagenes.emit(this.proyecto);
  }

  obtenerAltText(imagen: CarruselImagen, index: number): string {
    return imagen?.NombreCarruselImagen || `${this.titulo} - Imagen ${index + 1}`;
  }
}
