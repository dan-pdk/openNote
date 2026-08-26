# Para rodar o servidor local:
Requisitos: Docker & um terminal qualquer. Inicie no root do projeto.
*(Verifique se Docker está rodando)*
Criar container do banco:
> docker compose --env-file ../.env up -d

Reiniciar container do banco:
> docker compose --env-file ../.env restart

Ver logs do container do banco:
> docker compose --env-file ../.env logs -f

Desligar container do banco:
> docker compose --env-file ../.env down

Desligar e remover conteúdo do container do banco:
> docker compose --env-file ../.env down -v


## Para acessar o terminal interativo:
> docker exec -it opennote_db psql -U postgres_user -d open_note_data_base


## Comandos úteis no terminal interativo:
Sair do terminal
> \q

Listar todas as tabelas
> \dt

Listar entradas de uma tabela
> \d <nome>

Listar todos os bancos de dados
> \l