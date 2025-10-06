(function(){
    const editBtn = document.getElementById('editBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const form = document.getElementById('profileForm');
    const inputs = form.querySelectorAll('input');

    function setReadOnly(readonly){
        inputs.forEach(i => {
            if(readonly) i.setAttribute('readonly','');
            else i.removeAttribute('readonly');
        });
    }

    (function(){
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const form = document.getElementById('profileForm');
    const inputs = form.querySelectorAll('input');
    
    let datosOriginales = {};
    let modoEdicion = false;

    // Cargar datos del perfil al iniciar
    async function cargarPerfil() {
        try {
            const response = await fetch('/estudiante/api/perfil');
            if (!response.ok) throw new Error('Error al cargar perfil');
            
            const data = await response.json();
            
            // Actualizar avatar e información de la tarjeta
            document.getElementById('avatarInicial').innerHTML = `
                ${data.iniciales}
                <button class="avatar-btn" title="Cambiar foto">
                    <i class="fas fa-camera"></i>
                </button>
            `;
            document.getElementById('nombreUsuario').textContent = data.nombre;
            document.getElementById('correoUsuario').textContent = data.correo;
            document.getElementById('rolUsuario').textContent = data.rol;
            document.getElementById('totalMatriculas').textContent = data.estadisticas.total_matriculas;
            document.getElementById('fechaIngreso').textContent = data.fecha_ingreso;
            
            // Llenar formulario
            document.getElementById('nombre').value = data.nombre;
            document.getElementById('correo').value = data.correo;
            document.getElementById('documento').value = data.documento;
            document.getElementById('telefono').value = data.telefono;
            document.getElementById('direccion').value = data.direccion;
            
            // Guardar datos originales
            datosOriginales = {
                nombre: data.nombre,
                telefono: data.telefono,
                direccion: data.direccion
            };
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cargar los datos del perfil');
        }
    }

    function setReadOnly(readonly){
        inputs.forEach(i => {
            if(i.id !== 'correo' && i.id !== 'documento') {
                if(readonly) i.setAttribute('readonly','');
                else i.removeAttribute('readonly');
            }
        });
    }

    function toggleModoEdicion(editar) {
        modoEdicion = editar;
        setReadOnly(!editar);
        
        if (editar) {
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'inline-block';
            document.getElementById('nombre').focus();
        } else {
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
        }
    }

    editBtn.addEventListener('click', () => {
        toggleModoEdicion(true);
    });

    cancelBtn.addEventListener('click', () => {
        // Restaurar valores originales
        document.getElementById('nombre').value = datosOriginales.nombre;
        document.getElementById('telefono').value = datosOriginales.telefono;
        document.getElementById('direccion').value = datosOriginales.direccion;
        toggleModoEdicion(false);
    });

    saveBtn.addEventListener('click', async () => {
        const datosActualizados = {
            nombre: document.getElementById('nombre').value,
            telefono: document.getElementById('telefono').value,
            direccion: document.getElementById('direccion').value
        };

        try {
            const response = await fetch('/instructor/api/perfil', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosActualizados)
            });

            if (!response.ok) throw new Error('Error al actualizar perfil');

            alert('Datos guardados correctamente');
            datosOriginales = {...datosActualizados};
            toggleModoEdicion(false);
            
            // Actualizar nombre en la tarjeta
            document.getElementById('nombreUsuario').textContent = datosActualizados.nombre;
            
            // Actualizar iniciales
            const iniciales = datosActualizados.nombre.split(' ')
                .slice(0, 2)
                .map(p => p[0].toUpperCase())
                .join('');
            document.getElementById('avatarInicial').innerHTML = `
                ${iniciales}
                <button class="avatar-btn" title="Cambiar foto">
                    <i class="fas fa-camera"></i>
                </button>
            `;
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error al guardar los cambios');
        }
    });

    logoutBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
            window.location.href = '/logout';
        }
    });

    // Cargar perfil al iniciar
    cargarPerfil();
})();
    editBtn.addEventListener('click', () => {
        const isReadOnly = inputs[0].hasAttribute('readonly');
        if(isReadOnly){
            setReadOnly(false);
            editBtn.innerHTML = '<i class="fas fa-save"></i> Guardar';
            inputs[0].focus();
        } else {
            setReadOnly(true);
            editBtn.innerHTML = '<i class="fas fa-pen"></i> Editar';
            alert('Datos guardados correctamente');
        }
    });

    form.addEventListener('submit', function(e){
        e.preventDefault();
        const isReadOnly = inputs[0].hasAttribute('readonly');
        if(!isReadOnly){
            setReadOnly(true);
            editBtn.innerHTML = '<i class="fas fa-pen"></i> Editar';
            alert('Datos guardados correctamente');
        }
    });

    logoutBtn.addEventListener('click', () => {
        window.location.href = '/'; 
    });
})();