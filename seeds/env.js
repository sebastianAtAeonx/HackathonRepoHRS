/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("environment_variables").del();
  await knex("environment_variables").insert([
    {
      env_key: "CO_SHORT_NAME",
      env_value: "U2FsdGVkX18pA4wWjh6HBmUC/00VZmbb3KlwKqqXrOI=",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "CO_FULL_NAME",
      env_value:
        "U2FsdGVkX18H9wZHRRiKGQ3sG0dm4yAush74ty40VgTr712Wbef2EdxvDSQvIsvY",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "CO_ADD_1",
      env_value:
        "U2FsdGVkX1+xrlpr1d47Z5xfcH7h93wP6lhY1bwkFhyiaSU9g1/4T2EgmwxHZsU3",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "CO_ADD_2",
      env_value:
        "U2FsdGVkX1+WhSoMAb1uRk+0kplTmfmVMvSwBZ7kKHprnetdK/mF/DYY+JrruSye",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "CO_STATE",
      env_value: "U2FsdGVkX1+VD49OOIHM/lQ1Opa9EJjOhjGoWHpS/jo=",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "CO_COUNTRY",
      env_value: "U2FsdGVkX18I3NjE5Ys/8lqi/TOMTvijrjCWZXceACA=",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "CO_URL",
      env_value:
        "U2FsdGVkX18Twf1oS9kmsppMqDoL5oeqTSLNHjkVie3rFjzSCYALOSLrJ5fB4+DgBPe//cTP1lhnB5EhR9nAbA==",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "OTP_EMAIL",
      env_value:
        "U2FsdGVkX1+MC7GWFVwm0x5hbMn3BmiNuEn1lWwyQ7kaGd1qNB09WKNhyLvlynMm",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "SUPPORT_EMAIL",
      env_value:
        "U2FsdGVkX1+oeNQbtO8lIf+UJ7BzPKizJC14U5kRENA9k8J+tE/0vMEa3Mzt9d6v",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "NOTIFICATION_EMAIL",
      env_value:
        "U2FsdGVkX18Sn5hXE9Oq5Rf3E+px2PakdGloAZw7jPAumeryW/UHgYYiZ+gBmBtM",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "EMAIL_HOST",
      env_value: "U2FsdGVkX1+esgKPmusf+oGvAXsueyhyFvvxvZ4vQn4=",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "EMAIL_PORT",
      env_value: "U2FsdGVkX1+HMx+cP30ZyT+KfZj7/WEywfirD6Mht0w=",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "JWT_SECRET",
      env_value:
        "U2FsdGVkX1+KRiuTRjfCyZEVxG2N/Gnad/mcnzlZxXM2Y/c3Ga2oqp7T5BEYlQO2gco/htEVUrF8BfHERNM7BQ==",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "JWT_REFRESH_TOKEN_SECRET",
      env_value:
        "U2FsdGVkX184f6pQo27V9+FAphDGKD3WWhIy4OhTaSChKIVzvEWMoPiMHBwKoVDhO/6LM2GNmk6/cLWLUimvNQ==",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "JWT_TOKEN_EXPIER_TIME",
      env_value: "U2FsdGVkX1+ofdQDohiJgT3QLywllo7886knchAYT3k=",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "JWT_REFRESH_TOKEN_EXPIER_TIME",
      env_value: "U2FsdGVkX1+CMzuSTjhuBRthK7oy6909XdTol9wDEQw=",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "EMAIL",
      env_value: "U2FsdGVkX1+Hl0ZSt25kzBLP8mJ4O3lOedmGFRuVP+k=",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "EMAIL_PASSWORD",
      env_value: "U2FsdGVkX1/eLsnq+sACFNwfarRaTbscTfeIZW5Z2kU=",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "MASTER_INDIA_SECRET",
      env_value:
        "U2FsdGVkX19MlTPwtvrCDMB4IHqNuqHRGf4Mod0xVBpbtRasRe7OXN267GN1v4MD",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "DOCUMENT_DISPLAY_PATH",
      env_value:
        "U2FsdGVkX19BmnrDjl0eyv8ePL52HQCd0eg8F7so65PDRXCc5hVLkdRvLX/DT5XtCE4HsbQF/uhk+vuk2Fg+Qb7rohBHgsE7qmfYvuAD65I=",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "SAP_PO_URL",
      env_value: "U2FsdGVkX1+DMRq9qbJpfzGbw4sYTBN0c544RFQw9n0=",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "AUTH",
      env_value:
        "U2FsdGVkX19yF6nRw+wy1aeVzMV2Cu+LXQTl/jrlUo26q/bShXyl9HWer3L+KOAdcUUaOwiRwhtPyRtOBVn3SA==",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "SAP_IP",
      env_value: "U2FsdGVkX1/W6qJSpjNf2NQpSNdBbGN7mhN9KWZ++YE=",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "CLIENT",
      env_value: "U2FsdGVkX18Hy5XRPO/HmV5IHGcxz9VUdbnrGI0sg2s=",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "CLIENT_COOKIE",
      env_value:
        "U2FsdGVkX19v5QiK2pKC7jvbyvmoMki6UH+/aNxkiVkNzATeIZL43oCGzNHfoDU3",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "ZOOP_API_KEY",
      env_value:
        "U2FsdGVkX18RvVBRHpxgY1eEUNHyjcBTeXOvHX+FJW8iI6N6Ksnm+bovPDfbgK4e",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "ZOOP_API_ID",
      env_value:
        "U2FsdGVkX1+EXUnreQH/B+7r/zSdZaprBrmoyh9AAQQ6L1Ak0BTaj1s5N06AxQh9",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "ZOOP_URL",
      env_value:
        "U2FsdGVkX1+423KdvglRN3L9jXcLVwmtwx5c3a/mX2QoUE2/b8VvCzv4oxEGklDn",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "CO_LOGO",
      env_value:
        "U2FsdGVkX1/EHOSeA7Q5z/HgrHn16RkXrDKU9FDdQbjsFPigbeQe6duOgfPNJS1XhcM5Y0g1EphcXdhe6aPSmkwuKPGGUZf9K1EUIhMA/NU80f8dgkZ0LcW9x0o3vEhXQabfWi2kUMH6Tj834Ddvs45rHTeO6ca9kfkVEByThZM=",
      env_key_description: "",
      modifiedBy: null,
    },
    {
      env_key: "CO_PIN",
      env_value: "U2FsdGVkX1+zUXf9npYNQx6wVquAjhzjTnjyXHV3o14=",
      env_key_description: "",
      modifiedBy: null,
    },
  ]);
}
