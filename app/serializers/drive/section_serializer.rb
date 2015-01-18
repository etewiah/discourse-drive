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

    #even thought the r/n is belongs_to for category, seems I have to use has_one when serializing... 
    has_one :category, serializer: CategorySerializer, embed: :objects
    has_one :discette, serializer: DiscetteSerializer, embed: :objects
    has_many :section_users, serializer: Drive::SectionUserSerializer, embed: :objects
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
