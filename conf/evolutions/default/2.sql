# Users schema

# --- !Ups

create table users (
id bigserial primary key,
email varchar(254),
password_hash bytea,
salt bytea,
iteration_count integer,
admin boolean);

# --- !Downs

drop table users;
