module Drive
  class DetailedDiscetteSerializer < ApplicationSerializer
    attributes :id, :name, :slug, :description, :meta, :sections
  end

end
