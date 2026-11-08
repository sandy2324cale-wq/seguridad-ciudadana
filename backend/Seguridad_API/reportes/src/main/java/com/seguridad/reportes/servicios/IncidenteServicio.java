
package com.seguridad.reportes.servicios;

import com.seguridad.reportes.dto.IncidenteDTO;
import com.seguridad.reportes.dto.IncidenteRespuestaDTO;

import com.seguridad.reportes.entidades.AgenciaRespuesta;
import com.seguridad.reportes.entidades.CategoriaIncidente;
import com.seguridad.reportes.entidades.HistorialEstado;
import com.seguridad.reportes.entidades.Incidente;
import com.seguridad.reportes.entidades.Usuario;
import com.seguridad.reportes.entidades.Zona;

import com.seguridad.reportes.enums.EstadoIncidente;
import com.seguridad.reportes.enums.EstadoUsuario;
import com.seguridad.reportes.enums.Rol;

import com.seguridad.reportes.repositorios.AgenciaRepositorio;
import com.seguridad.reportes.repositorios.CategoriaRepositorio;
import com.seguridad.reportes.repositorios.HistorialEstadoRepositorio;
import com.seguridad.reportes.repositorios.IncidenteRepositorio;
import com.seguridad.reportes.repositorios.UsuarioRepositorio;
import com.seguridad.reportes.repositorios.ZonaRepositorio;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class IncidenteServicio {

    // ==========================================
    // 1. DEPENDENCIAS
    // ==========================================

    private final IncidenteRepositorio incidenteRepositorio;
    private final CategoriaRepositorio categoriaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final ZonaRepositorio zonaRepositorio;
    private final HistorialEstadoRepositorio historialEstadoRepositorio;
    private final AgenciaRepositorio agenciaRepositorio;

    // Nueva dependencia para la auditoría general.
    private final AuditoriaServicio auditoriaServicio;

    // ==========================================
    // 2. CONSTRUCTOR
    // ==========================================

    public IncidenteServicio(
            IncidenteRepositorio incidenteRepositorio,
            CategoriaRepositorio categoriaRepositorio,
            UsuarioRepositorio usuarioRepositorio,
            ZonaRepositorio zonaRepositorio,
            HistorialEstadoRepositorio historialEstadoRepositorio,
            AgenciaRepositorio agenciaRepositorio,
            AuditoriaServicio auditoriaServicio
    ) {
        this.incidenteRepositorio = incidenteRepositorio;
        this.categoriaRepositorio = categoriaRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.zonaRepositorio = zonaRepositorio;
        this.historialEstadoRepositorio = historialEstadoRepositorio;
        this.agenciaRepositorio = agenciaRepositorio;
        this.auditoriaServicio = auditoriaServicio;
    }

    // ==========================================
    // 3. OBTENER USUARIO AUTENTICADO
    // ==========================================

    private Usuario obtenerUsuario(String email) {

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Debe iniciar sesión"
            );
        }

        return usuarioRepositorio
                .findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Usuario autenticado no encontrado"
                        )
                );
    }

    // ==========================================
    // 4. VERIFICAR CUENTA ACTIVA
    // ==========================================

    private void verificarCuentaActiva(Usuario usuario) {

        if (usuario.getEstado() != EstadoUsuario.VALIDADA) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "La cuenta no está habilitada"
            );
        }
    }

    // ==========================================
    // 5. VERIFICAR PERSONAL AUTORIZADO
    // ==========================================

    private void verificarPersonalAutorizado(Usuario usuario) {

        verificarCuentaActiva(usuario);

        if (usuario.getRol() != Rol.OPERADOR &&
                usuario.getRol() != Rol.ADMIN &&
                usuario.getRol() != Rol.SUPER_ADMIN) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No tiene permisos para gestionar incidentes"
            );
        }
    }

    // ==========================================
    // 6. CONVERTIR ENTIDAD A DTO SEGURO
    // ==========================================

    private IncidenteRespuestaDTO convertirDTO(
            Incidente incidente
    ) {

        return new IncidenteRespuestaDTO(
                incidente.getId(),
                incidente.getTitulo(),
                incidente.getDescripcion(),
                incidente.getCallePrincipal(),
                incidente.getCalleSecundaria(),
                incidente.getEstado(),
                incidente.getFechaReporte(),

                incidente.getZona().getId(),
                incidente.getZona().getNombreZona(),

                incidente.getCategoria().getId(),
                incidente.getCategoria().getNombre(),

                incidente.getAgencia() != null
                        ? incidente.getAgencia().getId()
                        : null
        );
    }

    // ==========================================
    // 7. CREAR INCIDENTE
    // ==========================================

    @Transactional
    public IncidenteRespuestaDTO crear(
            IncidenteDTO dto,
            String emailUsuario
    ) {

        Usuario usuario = obtenerUsuario(emailUsuario);

        verificarCuentaActiva(usuario);

        if (usuario.getRol() != Rol.CLIENTE &&
                usuario.getRol() != Rol.OPERADOR) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Su rol no permite registrar incidentes"
            );
        }

        // Verificar zona seleccionada.
        Zona zona = zonaRepositorio.findById(dto.getZonaId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "La zona seleccionada no existe"
                        )
                );

        // Verificar categoría seleccionada.
        CategoriaIncidente categoria =
                categoriaRepositorio.findById(dto.getCategoriaId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "La categoría seleccionada no existe"
                                )
                        );

        // Crear el incidente con estado inicial.
        Incidente incidente = Incidente.builder()
                .titulo(dto.getTitulo().trim())
                .descripcion(dto.getDescripcion().trim())
                .callePrincipal(dto.getCallePrincipal().trim())
                .calleSecundaria(
                        dto.getCalleSecundaria() == null ||
                                dto.getCalleSecundaria().isBlank()
                                ? null
                                : dto.getCalleSecundaria().trim()
                )
                .usuario(usuario)
                .zona(zona)
                .categoria(categoria)
                .agencia(null)
                .estado(EstadoIncidente.PENDIENTE)
                .build();

        Incidente guardado =
                incidenteRepositorio.saveAndFlush(incidente);

        // Conservar historial individual del incidente.
        HistorialEstado historial = HistorialEstado.builder()
                .estadoAnterior(null)
                .estadoNuevo(EstadoIncidente.PENDIENTE)
                .observacion("Incidente registrado en el sistema")
                .incidente(guardado)
                .usuario(usuario)
                .build();

        historialEstadoRepositorio.save(historial);

        // ======================================
        // REGISTRAR EN AUDITORÍA GENERAL
        // ======================================

        auditoriaServicio.registrar(
                usuario.getEmail(),
                "CREAR_INCIDENTE",
                "Incidente ID " + guardado.getId()
                        + ". Título: " + guardado.getTitulo()
                        + ". Categoría ID: " + categoria.getId()
                        + ". Zona ID: " + zona.getId()
                        + ". Estado inicial: PENDIENTE"
        );

        return convertirDTO(guardado);
    }

    // ==========================================
    // 8. LISTAR MIS REPORTES
    // ==========================================

    @Transactional(readOnly = true)
    public List<IncidenteRespuestaDTO> listarMisIncidentes(
            String emailUsuario
    ) {

        Usuario usuario = obtenerUsuario(emailUsuario);

        verificarCuentaActiva(usuario);

        return incidenteRepositorio
                .findByUsuarioIdOrderByFechaReporteDesc(
                        usuario.getId()
                )
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    // ==========================================
    // 9. LISTAR TODOS LOS INCIDENTES
    // ==========================================

    @Transactional(readOnly = true)
    public List<IncidenteRespuestaDTO> listarTodos(
            String emailUsuario
    ) {

        Usuario usuario = obtenerUsuario(emailUsuario);

        verificarPersonalAutorizado(usuario);

        return incidenteRepositorio
                .findAllByOrderByFechaReporteDesc()
                .stream()
                .map(this::convertirDTO)
                .toList();
    }

    // ==========================================
    // 10. CONSULTAR INCIDENTE POR ID
    // ==========================================

    @Transactional(readOnly = true)
    public IncidenteRespuestaDTO obtenerPorId(
            Long id,
            String emailUsuario
    ) {

        Usuario usuario = obtenerUsuario(emailUsuario);

        verificarCuentaActiva(usuario);

        Incidente incidente = incidenteRepositorio.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Incidente no encontrado"
                        )
                );

        boolean propietario =
                incidente.getUsuario().getId()
                        .equals(usuario.getId());

        boolean personalAutorizado =
                usuario.getRol() == Rol.OPERADOR ||
                        usuario.getRol() == Rol.ADMIN ||
                        usuario.getRol() == Rol.SUPER_ADMIN;

        if (!propietario && !personalAutorizado) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Incidente no encontrado"
            );
        }

        return convertirDTO(incidente);
    }

    // ==========================================
    // 11. ASIGNAR AGENCIA
    // ==========================================

    @Transactional
    public IncidenteRespuestaDTO asignarAgencia(
            Long incidenteId,
            Long agenciaId,
            String observacion,
            String emailOperador
    ) {

        Usuario operador = obtenerUsuario(emailOperador);

        verificarPersonalAutorizado(operador);

        // Validar identificador de agencia.
        if (agenciaId == null || agenciaId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe seleccionar una agencia válida"
            );
        }

        // Validar observación.
        if (observacion == null ||
                observacion.isBlank() ||
                observacion.trim().length() > 255) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La observación debe tener entre 1 y 255 caracteres"
            );
        }

        Incidente incidente =
                incidenteRepositorio.findById(incidenteId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Incidente no encontrado"
                                )
                        );

        // No permitir cambios sobre incidentes cerrados.
        if (incidente.getEstado() == EstadoIncidente.RESUELTO ||
                incidente.getEstado() == EstadoIncidente.FALSO_REPORTE) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No puede asignar agencias a incidentes finalizados"
            );
        }

        AgenciaRespuesta agencia =
                agenciaRepositorio.findById(agenciaId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "La agencia seleccionada no existe"
                                )
                        );

        // Conservar la agencia anterior para
        // mostrar el cambio en auditoría.
        Long agenciaAnteriorId =
                incidente.getAgencia() != null
                        ? incidente.getAgencia().getId()
                        : null;

        incidente.setAgencia(agencia);

        Incidente guardado =
                incidenteRepositorio.save(incidente);

        // ======================================
        // REGISTRAR ASIGNACIÓN EN AUDITORÍA
        // ======================================

        auditoriaServicio.registrar(
                operador.getEmail(),
                "ASIGNAR_AGENCIA_INCIDENTE",
                "Incidente ID " + guardado.getId()
                        + ". Agencia anterior ID: "
                        + (agenciaAnteriorId == null
                                ? "SIN_ASIGNAR"
                                : agenciaAnteriorId)
                        + ". Agencia nueva ID: " + agencia.getId()
                        + ". Observación: " + observacion.trim()
        );

        return convertirDTO(guardado);
    }

    // ==========================================
    // 12. CAMBIAR ESTADO DEL INCIDENTE
    // ==========================================

    @Transactional
    public IncidenteRespuestaDTO cambiarEstado(
            Long incidenteId,
            EstadoIncidente nuevoEstado,
            String observacion,
            String emailUsuario
    ) {

        Usuario ejecutor = obtenerUsuario(emailUsuario);

        verificarPersonalAutorizado(ejecutor);

        if (nuevoEstado == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe seleccionar un estado"
            );
        }

        if (observacion == null ||
                observacion.isBlank() ||
                observacion.trim().length() > 255) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La observación debe tener entre 1 y 255 caracteres"
            );
        }

        Incidente incidente =
                incidenteRepositorio.findById(incidenteId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Incidente no encontrado"
                                )
                        );

        EstadoIncidente anterior = incidente.getEstado();

        // No registrar cambios inexistentes.
        if (anterior == nuevoEstado) {
            return convertirDTO(incidente);
        }

        // ======================================
        // VALIDAR TRANSICIONES PERMITIDAS
        // ======================================

        boolean transicionValida =

                (anterior == EstadoIncidente.PENDIENTE &&
                        (nuevoEstado == EstadoIncidente.EN_ATENCION ||
                                nuevoEstado == EstadoIncidente.FALSO_REPORTE))

                ||

                (anterior == EstadoIncidente.EN_ATENCION &&
                        (nuevoEstado == EstadoIncidente.RESUELTO ||
                                nuevoEstado == EstadoIncidente.FALSO_REPORTE));

        if (!transicionValida) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se permite cambiar de "
                            + anterior + " a " + nuevoEstado
            );
        }

        // ======================================
        // NO INICIAR ATENCIÓN SIN AGENCIA
        // ======================================

        if (nuevoEstado == EstadoIncidente.EN_ATENCION &&
                incidente.getAgencia() == null) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Debe asignar una agencia antes de iniciar la atención"
            );
        }

        // Guardar el nuevo estado.
        incidente.setEstado(nuevoEstado);

        Incidente guardado =
                incidenteRepositorio.save(incidente);

        // ======================================
        // CONSERVAR HISTORIAL DEL INCIDENTE
        // ======================================

        HistorialEstado historial = HistorialEstado.builder()
                .estadoAnterior(anterior)
                .estadoNuevo(nuevoEstado)
                .observacion(observacion.trim())
                .incidente(guardado)
                .usuario(ejecutor)
                .build();

        historialEstadoRepositorio.save(historial);

        // ======================================
        // REGISTRAR EN AUDITORÍA GENERAL
        // ======================================

        auditoriaServicio.registrar(
                ejecutor.getEmail(),
                "CAMBIAR_ESTADO_INCIDENTE",
                "Incidente ID " + guardado.getId()
                        + ". Estado anterior: " + anterior
                        + ". Estado nuevo: " + nuevoEstado
                        + ". Observación: " + observacion.trim()
        );

        return convertirDTO(guardado);
    }

    // ==========================================
    // 13. ELIMINACIÓN DESHABILITADA
    // ==========================================

    public void eliminar(Long id) {

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "No se permite eliminar incidentes porque debe conservarse su historial"
        );
    }
}
