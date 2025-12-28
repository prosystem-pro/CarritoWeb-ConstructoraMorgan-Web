import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarruselImagenServicio } from '../../Servicios/CarruselImagnServicio';
import { AlertaServicio } from '../../Servicios/Alerta-Servicio';
import { CarruselServicio } from '../../Servicios/CarruselServicio';
import { EmpresaServicio } from '../../Servicios/EmpresaServicio';
import { Carrusel } from '../../Modelos/Carrusel';
import { PermisoServicio } from '../../Autorizacion/AutorizacionPermiso';
import { Entorno } from '../../Entornos/Entorno';

interface ProyectoActual {
  titulo: string;
  descripcion: string;
  imagenes: { url: string; alt: string; id: number }[];
}

@Component({
  selector: 'app-carousel-proceso-construccion',
  imports: [CommonModule, FormsModule],
  templateUrl: './carousel-proceso-construccion.component.html',
  styleUrl: './carousel-proceso-construccion.component.css'
})
export class CarouselProcesoConstruccionComponent implements OnInit {
  private readonly NombreEmpresa = `${Entorno.NombreEmpresa}`;
  private readonly UbicacionCarrusel = 'carusel-prtos';
  private readonly TituloDefault = 'PROCESO DE CONSTRUCCIÓN INICIO A FIN';
  private readonly DescripcionDefault = 'Estéticamente atractivo, sino que también maximiza la experiencia del cliente y la rentabilidad para sus inversionistas.';
  
  activeIndex: number = 0;
  isLoading = true;
  error = false;
  errorMessage: string = '';
  datosListos: boolean = false;
  
  carruselData: any = null;
  codigoCarrusel: number = 0;
  detallesCarrusel: any[] = [];
  codigoEmpresa: number | null = null;

  modoEdicion: boolean = false;
  subiendoImagen: boolean = false;
  archivoSeleccionado: File | null = null;
  descripcionNuevaImagen: string = '';
  editandoInfo: boolean = false;
  tituloTemp: string = '';
  descripcionTemp: string = '';

  proyecto: ProyectoActual = {
    titulo: this.TituloDefault,
    descripcion: this.DescripcionDefault,
    imagenes: []
  };

  constructor(
    private carruselImagenServicio: CarruselImagenServicio,
    private alertaServicio: AlertaServicio,
    private carruselServicio: CarruselServicio,
    private empresaServicio: EmpresaServicio,
    public Permiso: PermisoServicio
  ) { }

  ngOnInit(): void {
    this.inicializarCarrusel();
  }

  private async inicializarCarrusel(): Promise<void> {
    this.isLoading = true;
    
    try {
      const empresa = await this.empresaServicio.ConseguirPrimeraEmpresa().toPromise();
      this.codigoEmpresa = empresa?.CodigoEmpresa || null;
      
      if (!this.codigoEmpresa) {
        throw new Error('No se pudo obtener información de la empresa');
      }

      const respuesta: any = await this.carruselServicio.Listado().toPromise();
      const carruseles = respuesta.data || [];
      let carrusel = carruseles.find((c: any) => c.Ubicacion === this.UbicacionCarrusel);
      
      if (!carrusel) {
        carrusel = await this.crearCarruselNuevo();
      }
      
      this.carruselData = carrusel;
      this.codigoCarrusel = carrusel.CodigoCarrusel;
      this.proyecto.titulo = carrusel.NombreCarrusel;
      this.proyecto.descripcion = carrusel.Descripcion || this.DescripcionDefault;
      
      await this.cargarImagenesCarrusel();
      
    } catch (error) {
      console.error('Error en inicialización:', error);
      this.error = true;
      this.errorMessage = 'Error al cargar el proceso de construcción';
      this.alertaServicio.MostrarError(this.errorMessage);
    } finally {
      this.isLoading = false;
      this.datosListos = true;
    }
  }

  private async crearCarruselNuevo(): Promise<any> {
    const carruselDefecto: Carrusel = {
      CodigoEmpresa: this.codigoEmpresa!,
      NombreCarrusel: this.TituloDefault,
      Descripcion: this.DescripcionDefault,
      Ubicacion: this.UbicacionCarrusel,
      Estatus: 1
    };

    try {
      const response = await this.carruselServicio.Crear(carruselDefecto).toPromise();
      
      if (response?.tipo === 'Éxito') {
        this.alertaServicio.MostrarExito(response.message || 'Carrusel creado correctamente');
      }
      
      return response.Entidad || response.data || response;
    } catch (error: any) {
      const tipo = error?.error?.tipo;
      const mensaje = error?.error?.error?.message || error?.error?.message || 'Ocurrió un error inesperado al crear el carrusel.';

      if (tipo === 'Alerta') {
        this.alertaServicio.MostrarAlerta(mensaje);
      } else {
        this.alertaServicio.MostrarError({ error: { message: mensaje } });
      }
      
      return carruselDefecto;
    }
  }

  private async cargarImagenesCarrusel(): Promise<void> {
    if (!this.carruselData?.CodigoCarrusel) {
      return;
    }

    try {
      const respuesta = await this.carruselImagenServicio
        .ListadoCarrusel(this.carruselData.CodigoCarrusel)
        .toPromise();
      
      this.detallesCarrusel = respuesta.data || [];
      this.proyecto.imagenes = this.detallesCarrusel.map((detalle: any) => ({
        id: detalle.CodigoCarruselImagen,
        url: detalle.UrlImagen || detalle.RutaImagen || detalle.Imagen,
        alt: detalle.NombreCarruselImagen || detalle.Descripcion || detalle.Titulo || 'Imagen del proceso'
      }));
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
      this.detallesCarrusel = [];
      this.proyecto.imagenes = [];
    }
  }

  getImagenesRotadas() {
    const total = this.proyecto.imagenes.length;
    if (total === 0) return [];
    
    const rotadas = [];
    for (let i = 0; i < total; i++) {
      const indexToUse = (this.activeIndex + i) % total;
      rotadas.push(this.proyecto.imagenes[indexToUse]);
    }
    return rotadas;
  }

  nextSlide() {
    if (this.proyecto.imagenes.length === 0) return;
    this.activeIndex = (this.activeIndex + 1) % this.proyecto.imagenes.length;
  }

  prevSlide() {
    if (this.proyecto.imagenes.length === 0) return;
    this.activeIndex = (this.activeIndex - 1 + this.proyecto.imagenes.length) % this.proyecto.imagenes.length;
  }
  
  trackById(index: number, item: any): number {
    return item.id;
  }

  actualizarInfoCarrusel(titulo: string, descripcion: string): void {
    if (!this.carruselData || !this.codigoCarrusel) {
      this.alertaServicio.MostrarError('No hay carrusel disponible para actualizar');
      return;
    }

    const datosActualizados: Carrusel = {
      CodigoCarrusel: this.codigoCarrusel,
      CodigoEmpresa: this.carruselData.CodigoEmpresa,
      NombreCarrusel: titulo,
      Descripcion: descripcion,
      Ubicacion: this.carruselData.Ubicacion,
      Estatus: this.carruselData.Estatus
    };

    this.carruselServicio.Editar(datosActualizados).subscribe({
      next: (response) => {
        this.alertaServicio.MostrarExito('Información actualizada correctamente');
        
        this.proyecto.titulo = titulo;
        this.proyecto.descripcion = descripcion;
        
        const datosActualizadosRespuesta = response.Entidad || response.data || response;
        if (datosActualizadosRespuesta) {
          this.carruselData = datosActualizadosRespuesta;
        }
      },
      error: (error) => {
        const mensaje = error?.error?.message || error?.error?.error?.message || 'Error al actualizar la información';
        this.alertaServicio.MostrarError(mensaje);
        console.error('Error en actualización:', error);
      }
    });
  }

  eliminarImagen(codigoImagen: number): void {
    this.alertaServicio
      .Confirmacion(
        '¿Está seguro de eliminar esta imagen del proceso de construcción?',
        'Esta acción no se puede deshacer.'
      )
      .then((confirmado) => {
        if (!confirmado) return;

        this.carruselImagenServicio.Eliminar(codigoImagen).subscribe({
          next: () => {
            this.alertaServicio.MostrarExito('Imagen eliminada correctamente');

            const cantidadImagenesActual = this.proyecto.imagenes.length;

            if (cantidadImagenesActual > 0) {
              if (this.activeIndex >= cantidadImagenesActual - 1) {
                this.activeIndex = Math.max(0, cantidadImagenesActual - 2);
              }
            } else {
              this.activeIndex = 0;
            }

            this.cargarImagenesCarrusel();
          },
          error: (error) => {
            const mensaje =
              error?.error?.message ||
              error?.error?.error?.message ||
              'Error al eliminar la imagen';

            this.alertaServicio.MostrarError(mensaje);
            console.error('Error al eliminar imagen:', error);
          },
        });
      });
  }

  agregarImagen(archivo: File, descripcion: string = ''): void {
    if (!this.codigoCarrusel) {
      this.alertaServicio.MostrarError('No hay carrusel disponible para agregar imágenes');
      this.subiendoImagen = false;
      return;
    }

    const formData = new FormData();
    formData.append('Imagen', archivo);
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
          this.alertaServicio.MostrarExito(response.message || 'Imagen agregada correctamente');
        }
        
        this.subiendoImagen = false;
        this.cancelarSubidaImagen();
        this.cargarImagenesCarrusel();
      },
      error: (error) => {
        const mensaje = error?.error?.message || error?.error?.error?.message || 'Error al agregar la imagen';
        this.alertaServicio.MostrarError(mensaje);
        console.error('Error al subir imagen:', error);
        this.subiendoImagen = false;
      }
    });
  }

  toggleModoEdicion(): void {
    this.modoEdicion = !this.modoEdicion;
    
    if (!this.modoEdicion) {
      this.cancelarEdicionInfo();
      this.cancelarSubidaImagen();
    }
  }

  activarEdicionInfo(): void {
    this.editandoInfo = true;
    this.tituloTemp = this.proyecto.titulo;
    this.descripcionTemp = this.proyecto.descripcion;
  }

  cancelarEdicionInfo(): void {
    this.editandoInfo = false;
    this.tituloTemp = '';
    this.descripcionTemp = '';
  }

  guardarEdicionInfo(): void {
    if (!this.tituloTemp.trim()) {
      this.alertaServicio.MostrarAlerta('El título es obligatorio');
      return;
    }

    this.actualizarInfoCarrusel(this.tituloTemp, this.descripcionTemp);
    this.editandoInfo = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const archivo = input.files[0];
      
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!tiposPermitidos.includes(archivo.type)) {
        this.alertaServicio.MostrarAlerta('Solo se permiten imágenes (JPG, PNG, WEBP, GIF)');
        this.archivoSeleccionado = null;
        input.value = '';
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (archivo.size > maxSize) {
        this.alertaServicio.MostrarAlerta('La imagen no debe superar los 5MB');
        this.archivoSeleccionado = null;
        input.value = '';
        return;
      }

      this.archivoSeleccionado = archivo;
    }
  }

  subirNuevaImagen(): void {
    if (!this.archivoSeleccionado) {
      this.alertaServicio.MostrarAlerta('Debe seleccionar una imagen');
      return;
    }

    this.subiendoImagen = true;
    this.agregarImagen(this.archivoSeleccionado, this.descripcionNuevaImagen);
  }

  cancelarSubidaImagen(): void {
    this.archivoSeleccionado = null;
    this.descripcionNuevaImagen = '';
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}