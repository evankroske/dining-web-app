# Users schema

# --- !Ups

create table users (
id serial primary key,
email varchar(254),
password_hash bytea,
salt bytea,
iteration_count integer);

# --- !Downs

drop table users;
