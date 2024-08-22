const roleResponse = (role) => {
    return {
        role_id: role.role_id,
        name: role.name,
        module: {
            id: role.module_id,
            name: role.name,
        },
        permissions: {
            read: role.readP,
            create: role.createP,
            update: role.updateP,
            delete: role.deleteP,
        },
    };
};

const getRoles = (role) => {
    console.log(role, "role");
    return {
        role_id: role.id,
        name: role.name,
        status: role.status
    };
}

export default {
    roleResponse,
    getRoles
};
