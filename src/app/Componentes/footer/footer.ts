import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EmpresaServicio } from '../../Servicios/EmpresaServicio';
import { Empresa } from '../../Modelos/Empresa';
import { AlertaServicio } from '../../Servicios/Alerta-Servicio';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer implements OnInit{
  numeroTelefono: string = '';
  empresa?: Empresa;

  constructor(private EmpresaServicio: EmpresaServicio, private alertaServicio: AlertaServicio) { }

  ngOnInit(): void {
    this.obtenerCodigoEmpresa();
  }

  private async obtenerCodigoEmpresa(): Promise<void> {
    try {
      const empresa = await firstValueFrom(
        this.EmpresaServicio.ConseguirPrimeraEmpresa()
      );

      if (empresa && empresa.Celular) {
        this.numeroTelefono = empresa.Celular ?? '';
      } else {
        console.warn('No se encontró información de empresa');
        this.alertaServicio.MostrarError(
          'No se pudo obtener la información de la empresa'
        );
      }
    } catch (error) {
      console.error('Error al obtener código de empresa:', error);
      this.alertaServicio.MostrarError('Error al cargar información de empresa');
    }
  }
}
