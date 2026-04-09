import { defineConfig } from 'prisma/config'

export default defineConfig({
datasource: {
    url: process.env.DATABASE_URL,
    // @ts-ignore: 'directUrl' no está en los tipos actuales pero es necesario para la conexión
    directUrl: process.env.DIRECT_URL,
  },
})