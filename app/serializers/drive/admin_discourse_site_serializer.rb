# initially added this to be able to calculate if site is listed (for admin)
module Drive
  class AdminDiscourseSiteSerializer < ApplicationSerializer
    attributes :id, :display_name, 
    :slug, :meta, :visible, :listed,
    :base_url, :description,
    :logo_url, :is_listed

    def is_listed
      # workaround till I decide on logic for this
      object.display_name != "hidden"
      # false
    end

  end

end
