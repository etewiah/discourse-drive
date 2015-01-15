module Drive
  require 'current_user'

  class SectionController < ::ApplicationController
    # if I inherit from my own App controller as below, I lose the useful helpers from discourse (such as current_user) in templates
    # Drive::ApplicationController
    include CurrentUser

    def all
      sections = Drive::Section.all
      return render json: sections.as_json, root: false
    end


  end
end
