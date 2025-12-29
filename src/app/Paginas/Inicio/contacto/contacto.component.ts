import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

import { ContactanosPortada } from '../../../Modelos/ContactanosPortada';
import { RedSocial } from '../../../Modelos/RedSocial';
import { RedSocialImagen } from '../../../Modelos/RedSocialImagen';
import { Entorno } from '../../../Entornos/Entorno';

import { PermisoServicio } from '../../../Autorizacion/AutorizacionPermiso';
import { RedSocialServicio } from '../../../Servicios/RedSocialServicio'
import { ReporteRedSocialServicio } from '../../../Servicios/ReporteRedSocialServicio';
import { RedSocialImagenServicio } from '../../../Servicios/RedSocialImagenServicio';
import { EmpresaServicio } from '../../../Servicios/EmpresaServicio';
import { ContactanosPortadaServicio } from '../../../Servicios/ContactanosPortadaServicio';
import { AlertaServicio } from '../../../Servicios/Alerta-Servicio';
import { SpinnerGlobalComponent } from '../../../Componentes/spinner-global/spinner-global.component';

@Component({
  selector: 'app-contacto',
  imports: [CommonModule, FormsModule, SpinnerGlobalComponent],
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.css']
})

export class ContactoComponent implements OnInit {
  private Url = `${Entorno.ApiUrl}`;
  private NombreEmpresa = `${Entorno.NombreEmpresa}`;
  numeroTelefonoEmpresa: string = '';

  constructor(
    private ServicioContactanosPortada: ContactanosPortadaServicio,
    public Permiso: PermisoServicio,
    private http: HttpClient,
    private EmpresaServicio: EmpresaServicio,
    private RedSocialServicio: RedSocialServicio,
    private RedSocialImagenServicio: RedSocialImagenServicio,
    private ReporteRedSocialServicio: ReporteRedSocialServicio,

    private sanitizer: DomSanitizer,
    private AlertaServicio: AlertaServicio
  ) { }

  ngOnInit(): void {
    this.obtenerTelefonoEmpresa();
  }

  datosContacto = {
    nombre: '',
    telefono: '',
    correo: '',
    nota: ''
  };

  private async obtenerTelefonoEmpresa(): Promise<void> {
    try {
      const empresa = await firstValueFrom(
        this.EmpresaServicio.ConseguirPrimeraEmpresa()
      );

      if (empresa?.Celular) {
        // Limpia el número para WhatsApp (quita espacios y guiones)
        this.numeroTelefonoEmpresa = empresa.Celular.replace(/\D/g, '');
      } else {
        this.AlertaServicio.MostrarError(
          'No se encontró el número de teléfono de la empresa'
        );
      }
    } catch (error) {
      console.error('Error al obtener teléfono:', error);
      this.AlertaServicio.MostrarError(
        'Error al cargar información de contacto'
      );
    }
  }

  abrirGoogleMaps() {
    const direccion = "Calle Santander, Panajachel, Solola";
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`, '_blank');
  }

  isIOS(): boolean {
    return /iPhone|iPad|iPod/.test(navigator.userAgent);
  }

  isSafari(): boolean {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  isAndroid(): boolean {
    return /Android/i.test(navigator.userAgent);
  }

  enviarFormulario(): void {

    if(this.datosContacto.nombre === '' || this.datosContacto.telefono === ''){
      this.AlertaServicio.MostrarAlerta('Complete todos los campos obligatorios');
      return;
    }

    if (!this.numeroTelefonoEmpresa) {
      this.AlertaServicio.MostrarError(
        'No se pudo enviar el mensaje. Teléfono no disponible.'
      );
      return;
    }

    const esIOS = this.isIOS() && this.isSafari();
    const esAndroid = this.isAndroid();

    let nuevaVentana: Window | null = null;

    if (esIOS) {
      nuevaVentana = window.open('', '_blank');
      if (!nuevaVentana) {
        console.error('El navegador bloqueó la ventana emergente.');
        return;
      }
    }

    const mensaje =
      `*Nuevo contacto desde la web – Solicitud de información de servicios*\n` +
      `*Nombre:* ${this.datosContacto.nombre}\n` +
      `*Teléfono:* ${this.datosContacto.telefono}\n` +
      `*Correo:* ${this.datosContacto.correo || 'No indicado'}\n` +
      `*Nota:* ${this.datosContacto.nota}`;

    const mensajeCodificado = encodeURIComponent(mensaje);

    // Número ya viene limpio (solo dígitos)
    const urlBase = `https://wa.me/502${this.numeroTelefonoEmpresa}`;
    const urlFinal = `${urlBase}?text=${mensajeCodificado}`;

    try {
      if (esIOS && nuevaVentana) {
        // Safari iOS
        nuevaVentana.location.href = urlFinal;
      } else {
        // Android, Desktop, otros
        window.open(urlFinal, '_blank');
      }
    } catch (error) {
      if (esIOS && nuevaVentana) nuevaVentana.close();
      this.AlertaServicio.MostrarError(
        'No se pudo abrir WhatsApp'
      );
    }

      // Limpiar formulario
    this.datosContacto = {
      nombre: '',
      telefono: '',
      correo: '',
      nota: ''
    };
  }


}

