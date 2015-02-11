module Drive
  class SummaryDiscourseSiteSerializer < ApplicationSerializer
    attributes :id, :display_name, 
    :slug, :base_url, :description,
    :logo_url
  end

end
