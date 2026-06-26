import { Container } from "@/components/reusables";
import React from "react";
import Categories from "./Categories";
import CategoryHeader from "./CategoryHeader";

const CategoryPage = () => {
  return (
    <section className="bg-soft py-14 sm:py-16">
      <Container>
        <CategoryHeader />
        <Categories />
      </Container>
    </section>
  );
};

export default CategoryPage;
