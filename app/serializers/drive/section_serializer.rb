module Drive
  class SectionSerializer < ApplicationSerializer
    attributes :name,
      :id,
      :subdomain_lower,
      :meta,
      :discette_id,
      :category_id,
      :discette_slug,
      :category_name,
      :category_slug

    # has_many :posters, serializer: TopicPosterSerializer, embed: :objects
    # # alias :include_starred? :has_user_data

    def discette_slug
      if object.discette
        object.discette.slug
      else
        ""
      end
    end

    def category_name
      if object.category then object.category.name else "" end 
    end

    def category_slug
      if object.category then object.category.slug else "" end 
    end

  end
end
