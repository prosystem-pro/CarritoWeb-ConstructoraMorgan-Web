import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Entorno } from '../Entornos/Entorno';
import { Servicio } from '../Modelos/Servicio';

@Injectable({
  providedIn: 'root'
})
export class ServicioServicios {

  private Url = `${Entorno.ApiUrl}servicio`;

  constructor(private http: HttpClient) { }

  Listado(): Observable<any> {
    return this.http.get(`${this.Url}/listado`);
  }

  ObtenerPorCodigo(Codigo: number | string): Observable<any> {
    return this.http.get(`${this.Url}/${Codigo}`);
  }

  Buscar(TipoBusqueda: string, ValorBusqueda: string): Observable<any> {
    return this.http.get(`${this.Url}/buscar/${TipoBusqueda}/${ValorBusqueda}`);
  }

  Crear(Datos: Servicio): Observable<any> {
    return this.http.post(`${this.Url}/crear`, Datos);
  }

  Editar(Datos: Servicio): Observable<any> {
    return this.http.put(
      `${this.Url}/editar/${Datos.CodigoServicio}`,
      Datos
    );
  }

  Eliminar(Codigo: number): Observable<any> {
    return this.http.delete(`${this.Url}/eliminar/${Codigo}`);
  }

  SubirImagen(formData: FormData): Observable<any> {
    return this.http.post(`${this.Url}/subir-imagen`, formData);
  }
}
