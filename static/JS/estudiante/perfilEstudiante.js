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

    editBtn.addEventListener('click', async () => {
        const isReadOnly = inputs[0].hasAttribute('readonly');
        if(isReadOnly){
            setReadOnly(false);
            editBtn.innerHTML = '<i class="fas fa-save"></i> Guardar';
            inputs[0].focus();
        } else {
            // Enviar cambios al backend Flask
            const data = {
                nombre: document.getElementById('nombre').value,
                correo: document.getElementById('correo').value,
                documento: document.getElementById('documento').value,
                telefono: document.getElementById('telefono').value
            };

            const res = await fetch('/perfil/actualizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert('Datos guardados correctamente');
            } else {
                alert('Error al guardar los datos');
            }

            setReadOnly(true);
            editBtn.innerHTML = '<i class="fas fa-pen"></i> Editar';
        }
    });

    logoutBtn.addEventListener('click', () => {
        window.location.href = '/logout';
    });
})();
