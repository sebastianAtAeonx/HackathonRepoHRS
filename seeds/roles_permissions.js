/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("roles_permissions").del();
  await knex("roles_permissions").insert([
    {
      id: 2,
      role_id: 3,
      module_permission:
        '{"module_permissions":[{"id":1,"permission":[0,1,0,0]},{"id":4,"permission":[0,1,0,0]},{"id":11,"permission":[0,1,0,0]},{"id":15,"permission":[0,1,0,0]},{"id":16,"permission":[0,1,0,0]},{"id":17,"permission":[0,1,0,0]},{"id":18,"permission":[0,1,0,0]},{"id":19,"permission":[0,1,0,0]},{"id":20,"permission":[0,1,0,0]},{"id":21,"permission":[0,1,0,0]},{"id":22,"permission":[0,1,0,0]},{"id":23,"permission":[0,1,0,0]},{"id":24,"permission":[0,1,0,0]},{"id":25,"permission":[0,1,0,0]},{"id":26,"permission":[0,1,0,0]},{"id":27,"permission":[0,1,0,0]},{"id":28,"permission":[0,1,0,0]},{"id":29,"permission":[0,1,0,0]},{"id":30,"permission":[0,1,0,0]},{"id":31,"permission":[0,1,0,0]},{"id":32,"permission":[0,1,0,0]},{"id":33,"permission":[0,1,0,0]},{"id":34,"permission":[0,1,0,0]},{"id":35,"permission":[0,1,0,0]},{"id":36,"permission":[0,1,0,0]},{"id":37,"permission":[0,1,0,0]},{"id":38,"permission":[0,1,0,0]},{"id":39,"permission":[0,1,0,0]},{"id":40,"permission":[0,1,0,0]},{"id":41,"permission":[0,1,0,0]},{"id":42,"permission":[0,1,0,0]},{"id":55,"permission":[0,1,0,0]},{"id":56,"permission":[0,1,0,0]},{"id":57,"permission":[0,1,0,0]},{"id":61,"permission":[0,1,0,0]},{"id":62,"permission":[0,1,0,0]},{"id":63,"permission":[0,1,0,0]},{"id":64,"permission":[0,1,0,0]}]}',
      modifiedBy: null,
    },
    {
      id: 3,
      role_id: 6,
      module_permission:
        '{"module_permissions":[{"id":1,"permission":[1,1,1,1]},{"id":4,"permission":[0,1,0,0]},{"id":11,"permission":[1,1,1,0]},{"id":15,"permission":[1,1,1,1]},{"id":16,"permission":[0,1,0,0]},{"id":17,"permission":[1,1,1,1]},{"id":18,"permission":[0,1,0,0]},{"id":19,"permission":[0,1,0,0]},{"id":20,"permission":[0,1,0,0]},{"id":21,"permission":[0,1,0,0]},{"id":22,"permission":[0,1,0,0]},{"id":23,"permission":[0,1,0,0]},{"id":24,"permission":[0,1,0,0]},{"id":25,"permission":[0,1,0,0]},{"id":26,"permission":[0,1,0,0]},{"id":27,"permission":[0,1,0,0]},{"id":28,"permission":[0,1,0,0]},{"id":29,"permission":[0,1,0,0]},{"id":30,"permission":[0,1,0,0]},{"id":31,"permission":[0,1,0,0]},{"id":32,"permission":[0,1,0,0]},{"id":33,"permission":[0,1,0,0]},{"id":34,"permission":[0,1,0,0]},{"id":35,"permission":[0,1,0,0]},{"id":36,"permission":[0,1,0,0]},{"id":37,"permission":[0,1,0,0]},{"id":38,"permission":[1,1,1,0]},{"id":39,"permission":[0,1,0,0]},{"id":40,"permission":[0,1,0,0]},{"id":41,"permission":[1,1,1,1]},{"id":42,"permission":[0,1,0,0]},{"id":55,"permission":[0,1,0,0]},{"id":56,"permission":[0,1,0,0]},{"id":57,"permission":[0,1,0,0]},{"id":61,"permission":[0,1,0,0]},{"id":62,"permission":[0,1,0,0]},{"id":63,"permission":[0,1,0,0]},{"id":64,"permission":[0,1,0,0]}]}',
      modifiedBy: null,
    },
    {
      id: 4,
      role_id: 7,
      module_permission:
        '{"module_permissions":[{"id":1,"permission":[1,1,1,1]},{"id":4,"permission":[1,1,1,1]},{"id":11,"permission":[1,1,1,1]},{"id":15,"permission":[1,1,1,1]},{"id":16,"permission":[1,1,1,1]},{"id":17,"permission":[1,1,1,1]},{"id":18,"permission":[1,1,1,1]},{"id":19,"permission":[1,1,1,1]},{"id":20,"permission":[1,1,1,1]},{"id":21,"permission":[1,1,1,1]},{"id":22,"permission":[1,1,1,1]},{"id":23,"permission":[1,1,1,1]},{"id":24,"permission":[1,1,1,1]},{"id":25,"permission":[1,1,1,1]},{"id":26,"permission":[1,1,1,1]},{"id":27,"permission":[1,1,1,1]},{"id":28,"permission":[1,1,1,1]},{"id":29,"permission":[1,1,1,1]},{"id":30,"permission":[1,1,1,1]},{"id":31,"permission":[1,1,1,1]},{"id":32,"permission":[1,1,1,1]},{"id":33,"permission":[1,1,1,1]},{"id":34,"permission":[1,1,1,1]},{"id":35,"permission":[1,1,1,1]},{"id":36,"permission":[1,1,1,1]},{"id":37,"permission":[1,1,1,1]},{"id":38,"permission":[1,1,1,1]},{"id":39,"permission":[1,1,1,1]},{"id":40,"permission":[1,1,1,1]},{"id":41,"permission":[1,1,1,1]},{"id":42,"permission":[1,1,1,1]},{"id":55,"permission":[1,1,1,1]},{"id":56,"permission":[1,1,1,1]},{"id":57,"permission":[1,1,1,1]},{"id":61,"permission":[1,1,1,1]},{"id":62,"permission":[1,1,1,1]},{"id":63,"permission":[1,1,1,1]},{"id":64,"permission":[1,1,1,1]}]}',
      modifiedBy: null,
    },
    {
      id: 5,
      role_id: 9,
      module_permission:
        '{"module_permissions":[{"id":1,"permission":[0,1,0,0]},{"id":4,"permission":[0,1,0,0]},{"id":11,"permission":[0,1,0,0]},{"id":15,"permission":[0,1,0,0]},{"id":16,"permission":[0,1,0,0]},{"id":17,"permission":[0,1,0,0]},{"id":18,"permission":[0,1,0,0]},{"id":19,"permission":[0,1,0,0]},{"id":20,"permission":[0,1,0,0]},{"id":21,"permission":[0,1,0,0]},{"id":22,"permission":[0,1,0,0]},{"id":23,"permission":[0,1,0,0]},{"id":24,"permission":[0,1,0,0]},{"id":25,"permission":[0,1,0,0]},{"id":26,"permission":[0,1,0,0]},{"id":27,"permission":[0,1,0,0]},{"id":28,"permission":[0,1,0,0]},{"id":29,"permission":[0,1,0,0]},{"id":30,"permission":[0,1,0,0]},{"id":31,"permission":[0,1,0,0]},{"id":32,"permission":[0,1,0,0]},{"id":33,"permission":[0,1,0,0]},{"id":34,"permission":[0,1,0,0]},{"id":35,"permission":[0,1,0,0]},{"id":36,"permission":[0,1,0,0]},{"id":37,"permission":[0,1,0,0]},{"id":38,"permission":[0,1,0,0]},{"id":39,"permission":[0,1,0,0]},{"id":40,"permission":[0,1,0,0]},{"id":41,"permission":[0,1,0,0]},{"id":42,"permission":[0,1,0,0]},{"id":55,"permission":[0,1,0,0]},{"id":56,"permission":[0,1,0,0]},{"id":57,"permission":[0,1,0,0]},{"id":61,"permission":[0,1,0,0]},{"id":62,"permission":[0,1,0,0]},{"id":63,"permission":[0,1,0,0]},{"id":64,"permission":[0,1,0,0]}]}',
      modifiedBy: null,
    },
    {
      id: 6,
      role_id: 23,
      module_permission:
        '{"module_permissions":[{"id":1,"permission":[0,1,0,0]},{"id":4,"permission":[0,1,0,0]},{"id":11,"permission":[0,1,0,0]},{"id":15,"permission":[0,1,0,0]},{"id":16,"permission":[0,1,0,0]},{"id":17,"permission":[0,1,0,0]},{"id":18,"permission":[0,1,0,0]},{"id":19,"permission":[0,1,0,0]},{"id":20,"permission":[0,1,0,0]},{"id":21,"permission":[0,1,0,0]},{"id":22,"permission":[0,1,0,0]},{"id":23,"permission":[0,1,0,0]},{"id":24,"permission":[0,1,0,0]},{"id":25,"permission":[0,1,0,0]},{"id":26,"permission":[0,1,0,0]},{"id":27,"permission":[0,1,0,0]},{"id":28,"permission":[0,1,0,0]},{"id":29,"permission":[0,1,0,0]},{"id":30,"permission":[0,1,0,0]},{"id":31,"permission":[0,1,0,0]},{"id":32,"permission":[0,1,0,0]},{"id":33,"permission":[0,1,0,0]},{"id":34,"permission":[0,1,0,0]},{"id":35,"permission":[0,1,0,0]},{"id":36,"permission":[0,1,0,0]},{"id":37,"permission":[0,1,0,0]},{"id":38,"permission":[0,1,0,0]},{"id":39,"permission":[0,1,0,0]},{"id":40,"permission":[0,1,0,0]},{"id":41,"permission":[0,1,0,0]},{"id":42,"permission":[0,1,0,0]},{"id":55,"permission":[0,1,0,0]},{"id":56,"permission":[0,1,0,0]},{"id":57,"permission":[0,1,0,0]},{"id":61,"permission":[1,1,0,0]},{"id":62,"permission":[0,1,0,0]},{"id":63,"permission":[0,1,0,0]},{"id":64,"permission":[0,1,0,0]}]}',
      modifiedBy: null,
    },
    {
      id: 7,
      role_id: 25,
      module_permission:
        '{"module_permissions":[{"id":1,"permission":[0,1,0,0]},{"id":4,"permission":[0,1,0,0]},{"id":11,"permission":[0,1,0,0]},{"id":15,"permission":[0,1,0,0]},{"id":16,"permission":[0,1,0,0]},{"id":17,"permission":[0,1,0,0]},{"id":18,"permission":[0,1,0,0]},{"id":19,"permission":[0,1,0,0]},{"id":20,"permission":[0,1,0,0]},{"id":21,"permission":[0,1,0,0]},{"id":22,"permission":[0,1,0,0]},{"id":23,"permission":[0,1,0,0]},{"id":24,"permission":[0,1,0,0]},{"id":25,"permission":[0,1,0,0]},{"id":26,"permission":[0,1,0,0]},{"id":27,"permission":[0,1,0,0]},{"id":28,"permission":[0,1,0,0]},{"id":29,"permission":[0,1,0,0]},{"id":30,"permission":[0,1,0,0]},{"id":31,"permission":[0,1,0,0]},{"id":32,"permission":[0,1,0,0]},{"id":33,"permission":[0,1,0,0]},{"id":34,"permission":[0,1,0,0]},{"id":35,"permission":[0,1,0,0]},{"id":36,"permission":[0,1,0,0]},{"id":37,"permission":[0,1,0,0]},{"id":38,"permission":[0,1,0,0]},{"id":39,"permission":[0,1,0,0]},{"id":40,"permission":[0,1,0,0]},{"id":41,"permission":[0,1,0,0]},{"id":42,"permission":[0,1,0,0]},{"id":55,"permission":[0,1,0,0]},{"id":56,"permission":[0,1,0,0]},{"id":57,"permission":[0,1,0,0]},{"id":61,"permission":[0,1,0,0]},{"id":62,"permission":[0,1,0,0]},{"id":63,"permission":[0,1,0,0]},{"id":64,"permission":[0,1,0,0]}]}',
      modifiedBy: null,
    },
    {
      id: 8,
      role_id: 26,
      module_permission:
        '{"module_permissions":[{"id":1,"permission":[0,1,0,0]},{"id":4,"permission":[0,1,0,0]},{"id":11,"permission":[0,1,0,0]},{"id":15,"permission":[0,1,0,0]},{"id":16,"permission":[0,1,0,0]},{"id":17,"permission":[0,1,0,0]},{"id":18,"permission":[0,1,0,0]},{"id":19,"permission":[0,1,0,0]},{"id":20,"permission":[0,1,0,0]},{"id":21,"permission":[0,1,0,0]},{"id":22,"permission":[0,1,0,0]},{"id":23,"permission":[0,1,0,0]},{"id":24,"permission":[0,1,0,0]},{"id":25,"permission":[0,1,0,0]},{"id":26,"permission":[0,1,0,0]},{"id":27,"permission":[0,1,0,0]},{"id":28,"permission":[0,1,0,0]},{"id":29,"permission":[0,1,0,0]},{"id":30,"permission":[0,1,0,0]},{"id":31,"permission":[0,1,0,0]},{"id":32,"permission":[0,1,0,0]},{"id":33,"permission":[0,1,0,0]},{"id":34,"permission":[0,1,0,0]},{"id":35,"permission":[0,1,0,0]},{"id":36,"permission":[0,1,0,0]},{"id":37,"permission":[0,1,0,0]},{"id":38,"permission":[0,1,0,0]},{"id":39,"permission":[0,1,0,0]},{"id":40,"permission":[0,1,0,0]},{"id":41,"permission":[0,1,0,0]},{"id":42,"permission":[0,1,0,0]},{"id":55,"permission":[0,1,0,0]},{"id":56,"permission":[0,1,0,0]},{"id":57,"permission":[0,1,0,0]},{"id":61,"permission":[0,1,0,0]},{"id":62,"permission":[0,1,0,0]},{"id":63,"permission":[0,1,0,0]},{"id":64,"permission":[0,1,0,0]}]}',
      modifiedBy: null,
    },
    {
      id: 9,
      role_id: 27,
      module_permission:
        '{"module_permissions":[{"id":1,"permission":[0,0,0,0]},{"id":4,"permission":[0,1,0,0]},{"id":11,"permission":[0,1,0,0]},{"id":15,"permission":[0,1,0,0]},{"id":16,"permission":[0,1,0,0]},{"id":17,"permission":[0,1,0,0]},{"id":18,"permission":[0,1,0,0]},{"id":19,"permission":[0,1,0,0]},{"id":20,"permission":[0,1,0,0]},{"id":21,"permission":[0,1,0,0]},{"id":22,"permission":[0,1,0,0]},{"id":23,"permission":[0,1,0,0]},{"id":24,"permission":[0,1,0,0]},{"id":25,"permission":[0,1,0,0]},{"id":26,"permission":[0,1,0,0]},{"id":27,"permission":[0,1,0,0]},{"id":28,"permission":[0,1,0,0]},{"id":29,"permission":[0,1,0,0]},{"id":30,"permission":[0,1,0,0]},{"id":31,"permission":[0,1,0,0]},{"id":32,"permission":[0,1,0,0]},{"id":33,"permission":[0,1,0,0]},{"id":34,"permission":[0,1,0,0]},{"id":35,"permission":[0,1,0,0]},{"id":36,"permission":[0,1,0,0]},{"id":37,"permission":[0,1,0,0]},{"id":38,"permission":[0,1,0,0]},{"id":39,"permission":[0,1,0,0]},{"id":40,"permission":[0,1,0,0]},{"id":41,"permission":[0,1,0,0]},{"id":42,"permission":[0,1,0,0]},{"id":55,"permission":[0,1,0,0]},{"id":56,"permission":[0,1,0,0]},{"id":57,"permission":[0,1,0,0]},{"id":61,"permission":[0,1,0,0]},{"id":62,"permission":[0,1,0,0]},{"id":63,"permission":[0,1,0,0]},{"id":64,"permission":[0,1,0,0]}]}',
      modifiedBy: null,
    },
    {
      id: 10,
      role_id: 28,
      module_permission:
        '{"module_permissions":[{"id":1,"permission":[0,1,0,0]},{"id":4,"permission":[0,1,0,0]},{"id":11,"permission":[0,1,0,0]},{"id":15,"permission":[0,1,0,0]},{"id":16,"permission":[0,1,0,0]},{"id":17,"permission":[0,1,0,0]},{"id":18,"permission":[0,1,0,0]},{"id":19,"permission":[0,1,0,0]},{"id":20,"permission":[0,1,0,0]},{"id":21,"permission":[0,1,0,0]},{"id":22,"permission":[0,1,0,0]},{"id":23,"permission":[0,1,0,0]},{"id":24,"permission":[0,1,0,0]},{"id":25,"permission":[0,1,0,0]},{"id":26,"permission":[0,1,0,0]},{"id":27,"permission":[0,1,0,0]},{"id":28,"permission":[0,1,0,0]},{"id":29,"permission":[0,1,0,0]},{"id":30,"permission":[0,1,0,0]},{"id":31,"permission":[0,1,0,0]},{"id":32,"permission":[0,1,0,0]},{"id":33,"permission":[0,1,0,0]},{"id":34,"permission":[0,1,0,0]},{"id":35,"permission":[0,1,0,0]},{"id":36,"permission":[0,1,0,0]},{"id":37,"permission":[0,1,0,0]},{"id":38,"permission":[0,1,0,0]},{"id":39,"permission":[0,1,0,0]},{"id":40,"permission":[0,1,0,0]},{"id":41,"permission":[0,1,0,0]},{"id":42,"permission":[1,1,0,0]},{"id":55,"permission":[0,1,0,0]},{"id":56,"permission":[0,1,0,0]},{"id":57,"permission":[0,1,0,0]},{"id":61,"permission":[0,1,0,0]},{"id":62,"permission":[0,1,0,0]},{"id":63,"permission":[0,1,0,0]},{"id":64,"permission":[0,1,0,0]}]}',
      modifiedBy: null,
    },
    {
      id: 11,
      role_id: 77,
      module_permission:
        '{"module_permissions":[{"id":1,"permission":[0,1,0,0]},{"id":4,"permission":[0,1,0,0]},{"id":11,"permission":[0,1,0,0]},{"id":15,"permission":[0,1,0,0]},{"id":16,"permission":[0,1,0,0]},{"id":17,"permission":[0,1,0,0]},{"id":18,"permission":[0,1,0,0]},{"id":19,"permission":[0,1,0,0]},{"id":20,"permission":[0,1,0,0]},{"id":21,"permission":[0,1,0,0]},{"id":22,"permission":[0,1,0,0]},{"id":23,"permission":[0,1,0,0]},{"id":24,"permission":[0,1,0,0]},{"id":25,"permission":[0,1,0,0]},{"id":26,"permission":[0,1,0,0]},{"id":27,"permission":[0,1,0,0]},{"id":28,"permission":[0,1,0,0]},{"id":29,"permission":[0,1,0,0]},{"id":30,"permission":[0,1,0,0]},{"id":31,"permission":[0,1,0,0]},{"id":32,"permission":[0,1,0,0]},{"id":33,"permission":[0,1,0,0]},{"id":34,"permission":[0,1,0,0]},{"id":35,"permission":[0,1,0,0]},{"id":36,"permission":[0,1,0,0]},{"id":37,"permission":[0,1,0,0]},{"id":38,"permission":[0,1,0,0]},{"id":39,"permission":[0,1,0,0]},{"id":40,"permission":[0,1,0,0]},{"id":41,"permission":[0,1,0,0]},{"id":42,"permission":[0,1,0,0]},{"id":55,"permission":[0,1,0,0]},{"id":56,"permission":[0,1,0,0]},{"id":57,"permission":[1,1,0,0]},{"id":61,"permission":[0,1,0,0]},{"id":62,"permission":[0,1,0,0]},{"id":63,"permission":[0,1,0,0]},{"id":64,"permission":[0,1,0,0]}]}',
      modifiedBy: null,
    },
    {
      id: 12,
      role_id: 80,
      module_permission:
        '{"module_permissions":[{"id":1,"permission":[0,1,0,0]},{"id":4,"permission":[0,1,0,0]},{"id":11,"permission":[0,1,0,0]},{"id":15,"permission":[0,1,0,0]},{"id":16,"permission":[0,1,0,0]},{"id":17,"permission":[0,1,0,0]},{"id":18,"permission":[0,1,0,0]},{"id":19,"permission":[0,1,0,0]},{"id":20,"permission":[0,1,0,0]},{"id":21,"permission":[0,1,0,0]},{"id":22,"permission":[0,1,0,0]},{"id":23,"permission":[0,1,0,0]},{"id":24,"permission":[0,1,0,0]},{"id":25,"permission":[0,1,0,0]},{"id":26,"permission":[0,1,0,0]},{"id":27,"permission":[0,1,0,0]},{"id":28,"permission":[0,1,0,0]},{"id":29,"permission":[0,1,0,0]},{"id":30,"permission":[0,1,0,0]},{"id":31,"permission":[0,1,0,0]},{"id":32,"permission":[0,1,0,0]},{"id":33,"permission":[0,1,0,0]},{"id":34,"permission":[0,1,0,0]},{"id":35,"permission":[0,1,0,0]},{"id":36,"permission":[0,1,0,0]},{"id":37,"permission":[0,1,0,0]},{"id":38,"permission":[0,1,0,0]},{"id":39,"permission":[0,1,0,0]},{"id":40,"permission":[0,1,0,0]},{"id":41,"permission":[0,1,0,0]},{"id":42,"permission":[0,1,0,0]},{"id":55,"permission":[0,1,0,0]},{"id":56,"permission":[0,1,0,0]},{"id":57,"permission":[0,1,0,0]},{"id":61,"permission":[0,1,0,0]},{"id":62,"permission":[0,1,0,0]},{"id":63,"permission":[0,1,0,0]},{"id":64,"permission":[0,1,0,0]}]}',
      modifiedBy: null,
    },
    {
      id: 22,
      role_id: 119,
      module_permission:
        '{"module_permissions":[{"id":1,"permission":[1,1,1,1]},{"id":4,"permission":[1,1,1,1]},{"id":11,"permission":[1,1,1,1]},{"id":15,"permission":[1,1,1,1]},{"id":16,"permission":[1,1,1,1]},{"id":17,"permission":[1,1,1,1]},{"id":18,"permission":[1,1,1,1]},{"id":19,"permission":[1,1,1,1]},{"id":20,"permission":[1,1,1,1]},{"id":21,"permission":[1,1,1,1]},{"id":22,"permission":[1,1,1,1]},{"id":23,"permission":[1,1,1,1]},{"id":24,"permission":[1,1,1,1]},{"id":25,"permission":[1,1,1,1]},{"id":26,"permission":[1,1,1,1]},{"id":27,"permission":[1,1,1,1]},{"id":28,"permission":[1,1,1,1]},{"id":29,"permission":[1,1,1,1]},{"id":30,"permission":[1,1,1,1]},{"id":31,"permission":[1,1,1,1]},{"id":32,"permission":[1,1,1,1]},{"id":33,"permission":[1,1,1,1]},{"id":34,"permission":[1,1,1,1]},{"id":35,"permission":[1,1,1,1]},{"id":36,"permission":[1,1,1,1]},{"id":37,"permission":[1,1,1,1]},{"id":38,"permission":[1,1,1,1]},{"id":39,"permission":[1,1,1,1]},{"id":40,"permission":[1,1,1,1]},{"id":41,"permission":[1,1,1,1]},{"id":42,"permission":[1,1,1,1]},{"id":55,"permission":[1,1,1,1]},{"id":56,"permission":[1,1,1,1]},{"id":57,"permission":[1,1,1,1]},{"id":61,"permission":[1,1,1,1]},{"id":62,"permission":[1,1,1,1]},{"id":63,"permission":[1,1,1,1]},{"id":64,"permission":[0,1,0,0]}]}',
      modifiedBy: null,
    },
  ]);
}
