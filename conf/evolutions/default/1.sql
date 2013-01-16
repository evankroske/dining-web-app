# usf schema

# --- !Ups

create table restaurants (
id serial primary key,
name varchar(100),
hours bit(336));

# --- !Downs

drop table restaurants;
