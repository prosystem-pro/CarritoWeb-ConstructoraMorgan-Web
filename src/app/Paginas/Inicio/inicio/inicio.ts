import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GaleriaComponente } from '../../../Componentes/galeria.componente/galeria.componente';
import { CarruselServicio } from '../../../Servicios/CarruselServicio';
import { AlertaServicio } from '../../../Servicios/Alerta-Servicio';
import { CarruselImagenServicio } from '../../../Servicios/CarruselImagnServicio';
import { PermisoServicio } from '../../../Autorizacion/AutorizacionPermiso';
import { Entorno } from '../../../Entornos/Entorno';
import { EmpresaServicio } from '../../../Servicios/EmpresaServicio';
import { Carrusel } from '../../../Modelos/Carrusel';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [GaleriaComponente, CommonModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {
  carruselProveedores: Carrusel | null = null;
  carruselClientes: Carrusel | null = null;
  imagenesProveedores: any[] = [];
  imagenesClientes: any[] = [];
  proveedoresListos: boolean = false;
  clientesListos: boolean = false;
  codigoCarruselProveedores: number = 0;
  codigoCarruselClientes: number = 0;

  isLoading = true;
  error = false;
  codigoEmpresa: number | null = null;
  errorMessage: string = '';

  private NombreEmpresa = `${Entorno.NombreEmpresa}`;

  constructor(
    private router: Router,
    private carruselServicio: CarruselServicio,
    private carruselImagenServicio: CarruselImagenServicio,
    public Permiso: PermisoServicio,
    private alertaServicio: AlertaServicio,
    private EmpresaServicio: EmpresaServicio
  ) { }

  ngOnInit(): void {
    this.cargarCarruselPorUbicacion('inicio-proveedores', 'proveedores');
    this.cargarCarruselPorUbicacion('inicio-clientes', 'clientes');
  }

  private cargarCarruselPorUbicacion(ubicacion: string, tipo: 'proveedores' | 'clientes'): void {
    this.carruselServicio.Listado().subscribe({
      next: (Respuesta: any) => {
        const carruseles = Respuesta.data || [];
        const carruselEncontrado = carruseles.find((c: any) => c.Ubicacion === ubicacion);

        if (carruselEncontrado) {
          if (tipo === 'proveedores') {
            this.carruselProveedores = carruselEncontrado;
            this.codigoCarruselProveedores = carruselEncontrado.CodigoCarrusel;
          } else {
            this.carruselClientes = carruselEncontrado;
            this.codigoCarruselClientes = carruselEncontrado.CodigoCarrusel;
          }

          this.cargarImagenesCarrusel(carruselEncontrado.CodigoCarrusel, tipo);
        } else {
          this.crearCarruselPorDefecto(ubicacion, tipo);
        }
      },
      error: (err) => {
        this.alertaServicio.MostrarError(`Error al obtener datos de ${tipo}`);
        this.marcarComoListo(tipo);
      }
    });
  }

  private cargarImagenesCarrusel(codigoCarrusel: number, tipo: 'proveedores' | 'clientes'): void {
    this.carruselImagenServicio.ListadoCarrusel(codigoCarrusel).subscribe({
      next: (Respuesta) => {
        const imagenes = (Respuesta.data || [])
          .filter((img: any) => img.Estatus === 1)
          .sort((a: any, b: any) => (a.Orden || 999) - (b.Orden || 999));

        if (tipo === 'proveedores') {
          this.imagenesProveedores = imagenes;
          this.proveedoresListos = true;
        } else {
          this.imagenesClientes = imagenes;
          this.clientesListos = true;
        }

      },
      error: (err) => {
        console.error(`Error al cargar imágenes de ${tipo}:`, err);

        if (tipo === 'proveedores') {
          this.imagenesProveedores = [];
          this.proveedoresListos = true;
        } else {
          this.imagenesClientes = [];
          this.clientesListos = true;
        }
      }
    });
  }

  private crearCarruselPorDefecto(ubicacion: string, tipo: 'proveedores' | 'clientes'): void {
    if (!this.codigoEmpresa) {
      this.marcarComoListo(tipo);
      return;
    }

    const nombreCarrusel = tipo === 'proveedores'
      ? 'Galería de Proveedores'
      : 'Galería de Clientes';

    const descripcion = tipo === 'proveedores'
      ? 'Carrusel de imágenes de proveedores'
      : 'Carrusel de imágenes de clientes';

    const carruselDefecto = {
      CodigoEmpresa: this.codigoEmpresa,
      NombreCarrusel: nombreCarrusel,
      Descripcion: descripcion,
      Ubicacion: ubicacion,
      Estatus: 1
    };

    this.carruselServicio.Crear(carruselDefecto).subscribe({
      next: (response) => {
        if (response?.tipo === 'Éxito') {
          this.alertaServicio.MostrarExito(response.message);
        }

        const carruselCreado = response.Entidad || response;

        if (tipo === 'proveedores') {
          this.carruselProveedores = carruselCreado;
        } else {
          this.carruselClientes = carruselCreado;
        }

        this.cargarImagenesCarrusel(carruselCreado.CodigoCarrusel, tipo);
      },
      error: (error) => {
        const mensaje = error?.error?.message || 'Ocurrió un error inesperado.';
        this.alertaServicio.MostrarError({ error: { message: mensaje } });
        this.marcarComoListo(tipo);
      }
    });
  }

  private marcarComoListo(tipo: 'proveedores' | 'clientes'): void {
    if (tipo === 'proveedores') {
      this.proveedoresListos = true;
      this.imagenesProveedores = [];
    } else {
      this.clientesListos = true;
      this.imagenesClientes = [];
    }
  }

  refrescarGaleria(tipo: 'proveedores' | 'clientes'): void {
    const ubicacion = tipo === 'proveedores' ? 'Nosotros' : 'MenuCategoria';

    if (tipo === 'proveedores') {
      this.proveedoresListos = false;
    } else {
      this.clientesListos = false;
    }

    this.cargarCarruselPorUbicacion(ubicacion, tipo);
  }

  abrirServicio(servicio: string): void {
    this.router.navigate(['/servicio', servicio]);
  }
}