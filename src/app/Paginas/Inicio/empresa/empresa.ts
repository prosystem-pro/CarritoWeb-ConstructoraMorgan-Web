import { Component, OnInit } from '@angular/core';
import { CarouselComponent } from '../../../Componentes/carousel/carousel.component';
import { CarruselImagenServicio } from '../../../Servicios/CarruselImagnServicio';
import { AlertaServicio } from '../../../Servicios/Alerta-Servicio';
import { CarruselServicio } from '../../../Servicios/CarruselServicio';
import { EmpresaServicio } from '../../../Servicios/EmpresaServicio';

@Component({
  selector: 'app-empresa',
  imports: [CarouselComponent],
  templateUrl: './empresa.html',
  styleUrl: './empresa.css'
})
export class Empresa implements OnInit {
  portadaData: any = null;
  carruselData: any = null;
  codigoCarrusel: number = 0;
  detallesCarrusel: any = null;
  titulo: string = '';
  isLoading = true;
  error = false;
  modoEdicion: boolean = false;
  datosOriginales: any = null;
  colorFooter: string = '';
  datosListos: boolean = false;
  codigoEmpresa: number | null = null;
  errorMessage: string = '';

  constructor(
    private carruselImagenServicio: CarruselImagenServicio,
    private alertaServicio: AlertaServicio,
    private carruselServicio: CarruselServicio,
    private EmpresaServicio: EmpresaServicio
  ) { }

  ngOnInit(): void {
    this.obtenerCodigoEmpresa().then(() => {
      this.cargarDatosCarrusel();
    });
  }

  private async obtenerCodigoEmpresa(): Promise<void> {
    try {
      const empresa = await this.EmpresaServicio.ConseguirPrimeraEmpresa().toPromise();
      if (empresa && empresa.CodigoEmpresa) {
        this.codigoEmpresa = empresa.CodigoEmpresa;
      } else {
        console.warn('No se encontró información de empresa');
        this.alertaServicio.MostrarError('No se pudo obtener la información de la empresa');
      }
    } catch (error) {
      console.error('Error al obtener código de empresa:', error);
      this.alertaServicio.MostrarError('Error al cargar información de empresa');
    }
  }

  cargarDatosCarrusel(): void {
    this.carruselServicio.Listado().subscribe({
      next: (Respuesta: any) => {
        const carruseles = Respuesta.data || [];
        const carruselNosotros = carruseles.find((c: any) => c.Ubicacion === 'empresa');

        if (carruselNosotros) {
          this.carruselData = carruselNosotros;
          this.codigoCarrusel = this.carruselData.CodigoCarrusel;
          this.titulo = this.carruselData.NombreCarrusel;
          this.cargarImagenesCarrusel();
        } else {
          this.crearCarruselPorDefecto();
        }
      },
      error: (err) => {
        this.alertaServicio.MostrarError('Error al obtener los datos del carrusel');
        this.crearCarruselPorDefecto();
      }
    });
  }

  private crearCarruselPorDefecto(): void {
    this.isLoading = true;
    if (!this.codigoEmpresa) {
      this.alertaServicio.MostrarError('No se puede crear el carrusel sin información de empresa');
      this.error = true;
      this.isLoading = false;
      return;
    }

    const carruselDefecto = {
      CodigoEmpresa: this.codigoEmpresa,
      NombreCarrusel: 'Galería empresa',
      Descripcion: 'Carrusel de imágenes principal para la sección Empresa',
      Ubicacion: 'empresa',
      Estatus: 1
    };

    this.carruselServicio.Crear(carruselDefecto).subscribe({
      next: (response) => {
        if (response?.tipo === 'Éxito') {
          this.alertaServicio.MostrarExito(response.message);
        }
        this.carruselData = response.Entidad || response;
        this.codigoCarrusel = this.carruselData.CodigoCarrusel;
        this.titulo = this.carruselData.NombreCarrusel;
        this.isLoading = false;
        this.cargarDatosCarrusel();
        this.cargarImagenesCarrusel();
      },
      error: (error) => {
        this.isLoading = false;
        const tipo = error?.error?.tipo;
        const mensaje =
          error?.error?.error?.message ||
          error?.error?.message ||
          'Ocurrió un error inesperado.';

        if (tipo === 'Alerta') {
          this.alertaServicio.MostrarAlerta(mensaje);
        } else {
          this.alertaServicio.MostrarError({ error: { message: mensaje } });
        }
        this.errorMessage = mensaje;

        this.carruselData = carruselDefecto;
        this.detallesCarrusel = [];
        this.datosListos = true;
      }
    });
  }

  private cargarImagenesCarrusel(): void {
    if (this.carruselData?.CodigoCarrusel) {
      this.carruselImagenServicio
        .ListadoCarrusel(this.carruselData.CodigoCarrusel)
        .subscribe({
          next: (Respuesta) => {
            this.detallesCarrusel = Respuesta.data;
            this.datosListos = true;
          },
          error: (err) => {
            this.detallesCarrusel = [];
            this.datosListos = true;
          },
        });
    }
  }
}
