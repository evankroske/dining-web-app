# usf schema

# --- !Ups

create table usf_restaurants (
id serial primary key,
name varchar(100),
sunday_hours bit(48),
monday_hours bit(48),
tuesday_hours bit(48),
wednesday_hours bit(48),
thursday_hours bit(48),
friday_hours bit(48),
saturday_hours bit(48));

# --- !Downs

drop table usf_restaurants;
