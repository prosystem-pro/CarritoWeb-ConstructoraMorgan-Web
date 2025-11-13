import { Component, Input, ViewChild, ElementRef, signal, computed, OnChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarruselImagen } from '../../Modelos/CarruselImagen';
import { CarruselImagenServicio } from '../../Servicios/CarruselImagnServicio';
import { PermisoServicio } from '../../Autorizacion/AutorizacionPermiso';
import { AlertaServicio } from '../../Servicios/Alerta-Servicio';
import { Entorno } from '../../Entornos/Entorno';
import { SpinnerGlobalComponent } from '../spinner-global/spinner-global.component';

interface ImagenEdicion {
  CodigoCarruselImagen: number;
  CodigoCarrusel: number;
  UrlImagen: string;
  imagen: File | null;
  imagenPreview: string | null;
}

interface NuevaImagen {
  imagen: File | null;
  imagenPreview: string | null;
}

@Component({
  selector: 'app-galeria',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerGlobalComponent],
  templateUrl: './galeria.componente.html',
  styleUrl: './galeria.componente.css'
})
export class GaleriaComponente implements OnChanges {
  private readonly NombreEmpresa = `${Entorno.NombreEmpresa}`;

  @Input() imagenesGaleria: CarruselImagen[] = [];
  @Input() nombreGaleria: string = '';
  @Input() codigoCarrusel: number = 0;

  @ViewChild('nuevoFileInput') nuevoFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('editFileInput') editFileInput!: ElementRef<HTMLInputElement>;

  imagenesSignal = signal<CarruselImagen[]>([]);

  modoEdicion = false;
  cargandoImagen = false;
  isLoading = false;
  errorMessage: string = '';

  readonly MAX_IMAGENES = 15;

  nuevaImagen: NuevaImagen = {
    imagen: null,
    imagenPreview: null
  };

  imagenEdicion: ImagenEdicion = {
    CodigoCarruselImagen: 0,
    CodigoCarrusel: 0,
    UrlImagen: '',
    imagen: null,
    imagenPreview: null
  };

  itemEnEdicion: CarruselImagen | null = null;

  imagenesActivas = computed(() =>
    this.imagenesSignal()
      .filter(img => img.Estatus === 1)
      .sort((a, b) => Number(a.Orden || 0) - Number(b.Orden || 0))
  );

  constructor(
    public Permiso: PermisoServicio,
    private carruselImagenServicio: CarruselImagenServicio,
    private alertaServicio: AlertaServicio,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnChanges() {
    if (this.imagenesGaleria) {
      this.imagenesSignal.set(this.imagenesGaleria);
    }
  }

  obtenerAltText(imagen: CarruselImagen): string {
    return imagen.NombreCarruselImagen || `Imagen ${imagen.CodigoCarruselImagen}`;
  }

  toggleModoEdicion(): void {
    this.modoEdicion = !this.modoEdicion;
    if (!this.modoEdicion) {
      this.cancelarEdicion();
      this.resetNuevaImagen();
    }
  }

  seleccionarImagenNuevo(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.alertaServicio.MostrarError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.alertaServicio.MostrarError('La imagen no debe superar los 5MB');
      return;
    }

    this.nuevaImagen.imagen = file;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.nuevaImagen.imagenPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  guardarNuevoImagen(): void {
    if (!this.nuevaImagen.imagen) {
      this.alertaServicio.MostrarAlerta('Por favor selecciona una imagen');
      return;
    }

    if (this.imagenesActivas().length >= this.MAX_IMAGENES) {
      this.alertaServicio.MostrarAlerta(`No puedes agregar más de ${this.MAX_IMAGENES} imágenes`);
      return;
    }

    this.subirImagenCarrusel();
  }

  subirImagenCarrusel(): void {
    if (!this.nuevaImagen.imagen) {
      this.alertaServicio.MostrarError('No hay archivo para subir');
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('Imagen', this.nuevaImagen.imagen);
    formData.append('CarpetaPrincipal', this.NombreEmpresa);
    formData.append('SubCarpeta', 'CarruselImagen');
    formData.append('CodigoVinculado', this.codigoCarrusel.toString());
    formData.append('CodigoPropio', '');
    formData.append('CampoVinculado', 'CodigoCarrusel');
    formData.append('CampoPropio', 'CodigoCarruselImagen');
    formData.append('NombreCampoImagen', 'UrlImagen');

    this.carruselImagenServicio.SubirImagen(formData).subscribe({
      next: (response: any) => {
        if (response?.tipo === 'Éxito') {
          this.alertaServicio.MostrarExito(response.message);
        }

        const nuevaImagenCarrusel: CarruselImagen = {
          UrlImagen: response.data.Entidad?.UrlImagen || response.url,
          CodigoCarruselImagen: response.data.Entidad?.CodigoCarruselImagen || 0,
          CodigoCarrusel: this.codigoCarrusel,
          Orden: (this.imagenesActivas().length + 1).toString(),
          Estatus: 1
        };

        const imagenesActualizadas = [...this.imagenesSignal(), nuevaImagenCarrusel];
        this.imagenesSignal.set(imagenesActualizadas);

        this.resetNuevaImagen();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        const tipo = error?.error?.tipo;
        const mensaje = error?.error?.error?.message || error?.error?.message || 'Ocurrió un error inesperado.';

        if (tipo === 'Alerta') {
          this.alertaServicio.MostrarAlerta(mensaje);
        } else {
          this.alertaServicio.MostrarError({ error: { message: mensaje } });
        }

        this.errorMessage = mensaje;
        this.cdr.detectChanges();
      }
    });
  }

  resetNuevaImagen(): void {
    this.nuevaImagen = {
      imagen: null,
      imagenPreview: null
    };
    if (this.nuevoFileInput) {
      this.nuevoFileInput.nativeElement.value = '';
    }
  }

  iniciarEdicion(item: CarruselImagen): void {
    if (this.itemEnEdicion !== null) {
      this.cancelarEdicion();
    }

    this.itemEnEdicion = item;

    this.imagenEdicion = {
      CodigoCarruselImagen: item.CodigoCarruselImagen || 0,
      CodigoCarrusel: item.CodigoCarrusel || this.codigoCarrusel,
      UrlImagen: item.UrlImagen || '',
      imagen: null,
      imagenPreview: item.UrlImagen || null
    };
  }

  esItemEnEdicion(item: CarruselImagen): boolean {
    return !!this.itemEnEdicion &&
      this.itemEnEdicion.CodigoCarruselImagen === item.CodigoCarruselImagen;
  }

  seleccionarImagenEdicion(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.alertaServicio.MostrarError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.alertaServicio.MostrarError('La imagen no debe superar los 5MB');
      return;
    }

    this.imagenEdicion.imagen = file;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.imagenEdicion.imagenPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  guardarEdicion(): void {
    if (!this.imagenEdicion.imagen) {
      this.alertaServicio.MostrarAlerta('Por favor selecciona una nueva imagen');
      return;
    }

    this.actualizarImagenCarrusel();
  }

  actualizarImagenCarrusel(): void {
    if (!this.imagenEdicion.imagen) {
      this.alertaServicio.MostrarAlerta('No hay archivo para actualizar');
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('Imagen', this.imagenEdicion.imagen);
    formData.append('CarpetaPrincipal', this.NombreEmpresa);
    formData.append('SubCarpeta', 'CarruselImagen');
    formData.append('CodigoVinculado', this.imagenEdicion.CodigoCarrusel.toString());
    formData.append('CodigoPropio', this.imagenEdicion.CodigoCarruselImagen.toString());
    formData.append('CampoVinculado', 'CodigoCarrusel');
    formData.append('CampoPropio', 'CodigoCarruselImagen');
    formData.append('NombreCampoImagen', 'UrlImagen');

    this.carruselImagenServicio.SubirImagen(formData).subscribe({
      next: (response: any) => {
        if (response?.tipo === 'Éxito') {
          this.alertaServicio.MostrarExito(response.message);
        }

        if (this.itemEnEdicion) {
          const imagenesActualizadas = this.imagenesSignal().map(img =>
            img.CodigoCarruselImagen === this.imagenEdicion.CodigoCarruselImagen
              ? { ...img, UrlImagen: response.data.Entidad?.UrlImagen || response.url }
              : img
          );
          this.imagenesSignal.set(imagenesActualizadas);
        }

        this.isLoading = false;
        this.cancelarEdicion();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;

        const tipo = error?.error?.tipo;
        const mensaje = error?.error?.error?.message || error?.error?.message || 'Ocurrió un error inesperado.';

        if (tipo === 'Alerta') {
          this.alertaServicio.MostrarAlerta(mensaje);
        } else {
          this.alertaServicio.MostrarError({ error: { message: mensaje } });
        }

        this.errorMessage = mensaje;
        this.cdr.detectChanges();
      }
    });
  }

  cancelarEdicion(): void {
    this.itemEnEdicion = null;
    this.imagenEdicion = {
      CodigoCarruselImagen: 0,
      CodigoCarrusel: 0,
      UrlImagen: '',
      imagen: null,
      imagenPreview: null
    };
    if (this.editFileInput) {
      this.editFileInput.nativeElement.value = '';
    }
  }

  eliminarImagen(item: CarruselImagen): void {
    this.alertaServicio.Confirmacion(
      '¿Está seguro que desea eliminar esta imagen?',
      'Esta acción no se puede deshacer.'
    ).then((confirmado) => {
      if (confirmado) {
        this.isLoading = true;
        const codigoCarruselImagen = item.CodigoCarruselImagen;

        if (!codigoCarruselImagen) {
          this.alertaServicio.MostrarError('No se puede eliminar la imagen');
          this.isLoading = false;
          return;
        }

        this.carruselImagenServicio.Eliminar(codigoCarruselImagen).subscribe({
          next: (response) => {
            if (response?.tipo === 'Éxito') {
              this.alertaServicio.MostrarExito(response.message);
            }

            // Eliminar la imagen de la lista
            const imagenesActualizadas = this.imagenesSignal().filter(
              img => img.CodigoCarruselImagen !== codigoCarruselImagen
            );
            this.imagenesSignal.set(imagenesActualizadas);

            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.isLoading = false;

            const tipo = error?.error?.tipo;
            const mensaje = error?.error?.error?.message || error?.error?.message || 'Ocurrió un error inesperado.';

            if (tipo === 'Alerta') {
              this.alertaServicio.MostrarAlerta(mensaje);
            } else {
              this.alertaServicio.MostrarError({ error: { message: mensaje } });
            }

            this.errorMessage = mensaje;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  puedeAgregarImagen(): boolean {
    return this.imagenesActivas().length < this.MAX_IMAGENES;
  }
}